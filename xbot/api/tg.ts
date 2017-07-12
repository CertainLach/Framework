import {Api,User,Chat,MessageEvent,ForwardedMessage,Gender,Location,Image,File,Audio,TitleChangeEvent,JoinEvent,LeaveEvent,ActionEvent} from "../";
import XRest from "@meteor-it/xrest";
import * as multipart from '@meteor-it/xrest/multipart';
import Cache from '@meteor-it/cache';
import {readStream} from '@meteor-it/utils-node';

export default class TGApi extends Api{
    logged=false;
    constructor(){
        super('TGAPI');
    }
    async auth(token){
        this.logged=true;
        this.token=token;
        this.xrest=new XRest('https://api.telegram.org/',{});
        this.logger.log('Done!');
        await this.startReceiver();
    }
    async execute(method,params={},multipart=false){
        if(!this.logged)
            throw new Error('User is not logged in!');
        let token=this.token;
        let res=await this.xrest.emit(`POST /bot${token}/${method}`,{multipart,data:{
            ...params
        }});
        res=res.body;
        if(res.ok){
            return res.result;
        }else{
            throw new Error(res.description);
        }
    }

    longPoolOffset;
    async startReceiver(){
        this.longPoolOffset=-1;
        this.receive();
    }
    async getFileById(id){
        let res=await this.execute('getFile',{
            file_id:id
        });
        return {
            link:`https://api.telegram.org/file/bot${this.token}/${res.file_path}`,
            size:res.file_size
        };
    }
    async uGetUser(uid){
        if(!uid.startsWith('TGC.'))
            return null;
        let id=uid.substr(3);
        if(!id)
            return null;
        id=+id;
        if(isNaN(id))
            return null;
        return await this.getUserFromApiData({
            id,
            username:'I',
            first_name:'Hate',
            last_name:'Telegram API',
        });
    }
    async uGetChat(cid){
        if(!cid.startsWith('TGC.'))
            return null;
        let id=cid.substr(4);
        if(!id)
            return null;
        id=+id;
        if(isNaN(id))
            return null;
        return await this.getChat(id);
    }
    async getChat(id){
        let res=await this.execute('getChat',{
            chat_id:id
        });
        return await this.getChatFromApiData(res);
    }
    async getUserFromApiData(data){
        let photoFile=await Cache.get('TG:PHOTO:'+data.id);
        if(!photoFile){
            let photoD=this.execute('getUserProfilePhotos',{user_id:data.id});
            let photo=await photoD;
            photoFile=await this.getFileById(photo.photos.slice(-1)[0].slice(-1)[0].file_id);
            await Cache.set('TG:PHOTO:'+data.id,photoFile);
        }
        return new User({
            api:this,
            uid:'TG.'+data.id,
            targetId:data.id,
            nickName:data.username || data.first_name,
            firstName:data.first_name || data.username,
            lastName:data.last_name || '',
            gender:Gender.MAN,
            photoUrl:photoFile.link,
            profileUrl:'https://telegram.me/'+data.username
        });
    }
    async getChatFromApiData(data){
        return new Chat({
            api:this,
            cid:'TGC.'+data.id,
            targetId:data.id,
            title:data.title,
            users:[],
            admins:[],
            photoUrl:'http://www.myiconfinder.com/uploads/iconsets/256-256-b381526610eb3ed95c7fdf75f1ec54d5.png'});
    }
    async parseAttachment(msg){
        //TODO: Support attachments
        return undefined;
    }
    async receive(){
        let result=await this.execute('getUpdates',{
            offset:this.longPoolOffset,
            allowed_updates:[]
        });
        result.forEach(async update=>{
            if(update.update_id+1>this.longPoolOffset)
                this.longPoolOffset=update.update_id+1;
            let type=Object.keys(update)[1];
            switch(type){
                case 'message':{
                    update=update.message;
                    if(update.forward_from)
                        return;
                    let text=update.text||update.caption;
                    let inChat=update.chat.type!=='private';
                    let chat=undefined;
                    if(inChat){
                        chat=await this.getChatFromApiData(update.chat);
                    }
                    let user=await this.getUserFromApiData(update.from);
                    let forwarded=undefined;
                    if(update.reply_to_message){
                        forwarded=new ForwardedMessage({
                            text:update.reply_to_message.text||update.reply_to_message.caption,
                            sender:await this.getUserFromApiData(update.reply_to_message.from),
                            attachment:await this.parseAttachment(update.reply_to_message)
                        });
                    }

                    let message=new MessageEvent({
                        api:this,
                        attachment:await this.parseAttachment(update),
                        text:text,
                        user,
                        chat,
                        replyTo:forwarded,
                        messageId:update.message_id
                    });
                    this.emit('message',message);


                    break;
                }
                default:
                    this.logger.error('Unhandled type: '+type);
            }
        });
        setTimeout(()=>this.receive(),1);
    }
    //Implementing Api class methods
    async sendLocation(targetId,answer,caption,location,options){

    }
    async sendText(targetId,answer,text,options){
        this.execute('sendMessage',{
            chat_id:targetId,
            text,
            reply_to_message_id:answer
        });
    }

    async sendImageStream(targetId,answer,caption,image,options){
        this.execute('sendPhoto',{
            chat_id:targetId,
            caption,
            reply_to_message_id:answer,
            photo:new multipart.Data(image.name, 'image/jpeg', image.stream._object?image.stream._object:await readStream(image.stream))
        },true);
    }
    async sendFileStream(targetId,answer,caption,file,options){

    }
    async sendAudioStream(targetId,answer,caption,audio,options){

    }
    async sendCustom(targetId,answer,options){
    }
}