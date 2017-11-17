import {Api,User,Chat,MessageEvent,ForwardedMessage,Gender,Location,Image,File,Audio,TitleChangeEvent,JoinEvent,LeaveEvent,ActionEvent} from "../";
import XRest from "@meteor-it/xrest";
import * as multipart from '@meteor-it/xrest/multipart';
import {readStream} from '@meteor-it/utils';
import * as TelegramBot from 'node-telegram-bot-api';

export default class TGApi extends Api{
    logged=false;
    bot: TelegramBot;
    constructor(){
        super('TGAPI');
    }
    async auth(token){
        const bot = new TelegramBot(token, {
            polling: true
        });
        this.bot=bot;
        this.logger.log('Logged in')
        this.logged=true;
        this.startReceiver();
    }
    async parseAttachment(type,obj){
        switch(type){
            case 'photo':
                return await Image.fromUrl(await this.bot.getFileLink(obj[obj.length-1].file_id));
            case 'document':
                return await File.fromUrl(await this.bot.getFileLink(obj.file_id),obj.file_name);
            case 'location':
                return new Location(obj.latitude,obj.longitude);
            default:
                this.logger.error('Unknown type: '+type,obj);
                return null;
        }
    }
    async startReceiver(){
        this.bot.on('message', async (msg) => {
            const chatId = msg.chat.id;
            let replyTo=undefined;
            if(msg.reply_to_message){
                let attachment=null;
                let attachmentType;
                for(let type of 'document,photo,location'.split(','))
                    if(msg.reply_to_message[type]){
                        attachment=msg.reply_to_message[type];
                        attachmentType=type;
                    }
                replyTo=new ForwardedMessage({
                    text:msg.reply_to_message.caption||msg.reply_to_message.text||'',
                    sender: await this.getUserFromApiData(msg.reply_to_message.from),
                    attachment: await this.parseAttachment(attachmentType,attachment)
                });
            }
            let attachment=null;
            let attachmentType;
            for(let type of 'document,photo,location'.split(','))
                if(msg[type]){
                    attachment=msg[type];
                    attachmentType=type;
                }
            if(attachment!==null){
                attachment = await this.parseAttachment(attachmentType,attachment);
            }
            let text=msg.caption||msg.text||'';
            let user = await this.getUserFromApiData(msg.from);
            let chat = null;
            if ('group,supergroup,channel'.includes(msg.chat.type))
                chat = await this.getChatFromApiData(msg.chat);
            let isChat=!!chat;
            let message = new MessageEvent({
                api: this,
                attachment,
                text: text,
                user,
                chat: isChat ? chat : undefined,
                replyTo,
                messageId: msg.message_id
            });
            message.user.messageId = msg.message_id;
            if (message.chat)
                message.chat.messageId = msg.message_id;
            this.emit('message', message);
        });
    }
    async uGetUser(uid:string):Promise<User>{
        if(!uid.startsWith('TG.'))
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
    async uGetChat(cid:string):Promise<Chat>{
        if(!cid.startsWith('TGC.'))
            return null;
        let id=cid.substr(4);
        if(!id)
            return null;
        id=+id;
        if(isNaN(id))
            return null;
        return await this.getChatFromApiData({
            id,
            title:'I hate telegram'
        });
    }
    photoCache=new Map();
    async getUserFromApiData(data){
        let photoFile=this.photoCache.get('TG:PHOTO:'+data.id);
        if(!photoFile){
            let photoD=await this.bot.getUserProfilePhotos(data.id);
            photoD=photoD.photos[photoD.photos.length-1];
            photoD=photoD[photoD.length-1];
            photoFile=await this.bot.getFileLink(photoD.file_id);
            this.photoCache.set('TG:PHOTO:'+data.id,photoFile);
        }
        return new User({
            messageId:null,
            api:this,
            uid:'TG.'+data.id,
            targetId:data.id,
            nickName:data.username || data.first_name,
            firstName:data.first_name || data.username,
            lastName:data.last_name || '',
            gender:Gender.MAN,
            photoUrl:photoFile,
            profileUrl:'https://telegram.me/'+data.username
        });
    }
    async getChatFromApiData(data){
        return new Chat({
            messageId:null,
            api:this,
            cid:'TGC.'+data.id,
            targetId:data.id,
            title:data.title,
            users:[],
            admins:[],
            photoUrl:'http://www.myiconfinder.com/uploads/iconsets/256-256-b381526610eb3ed95c7fdf75f1ec54d5.png'
        });
    }
    async sendLocation(targetId,answer,caption,location,options){

    }
    async sendText(targetId,answer,text,options){
        let opts:any={};
        if(options.keyboard){
            opts.reply_markup={
                inline_keyboard:options.keyboard.map(row=>row.map(btn=>({text:btn[0],callback_data:btn[1]})))
            }
        }
        await this.bot.sendMessage(targetId, text, {
            reply_to_message_id:answer,
            ...options.keyboard
        });
    }

    async sendImageStream(targetId,answer,caption,image,options){
        image.stream.path='aaaaa.jpeg';
        await this.bot.sendPhoto(targetId, image.stream, {
            reply_to_message_id:answer,
            caption
        });
    }
    async sendFileStream(targetId,answer,caption,file,options){

    }
    async sendAudioStream(targetId,answer,caption,audio,options){

    }
    async sendCustom(targetId,answer,options){
    }
}