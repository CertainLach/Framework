import {Api,User,Chat,MessageEvent,ForwardedMessage,Gender,Location,Image,File,Audio,TitleChangeEvent,JoinEvent,LeaveEvent,ActionEvent} from "../";
import queue from "@meteor-it/queue";
import XRest,{emit} from "@meteor-it/xrest";
import * as multipart from '@meteor-it/xrest/multipart';
import {asyncEach} from '@meteor-it/utils';
import TimingData from '../TimingData';

const OFFICIAL_SCOPES=['audio'];
const EXECUTE_IN_SINGLE=[
    'docs.save',
    'video.save',
    'docs.getUploadServer',
    'photos.saveMessagesPhoto',
    'photos.getMessagesUploadServer'
];
const SPACE_REPLACE=String.fromCharCode(8194);

export default class VKApi extends Api{
    logged=false;
    tokens:string[]=[];
    xrest: XRest;
    uploadToken='';
    constructor(){
        super('VKAPI');
    }
    async auth(tokens:string[]){
        try{
            if(!(tokens instanceof Array)){
                this.logger.warn('Use multiple tokens, luke!');
                tokens=[tokens];
            }
            if(tokens.length<2){
                throw new Error('Minimal token count is 2');
            }
            this.logged=true;
            this.uploadToken=tokens.pop();
            this.tokens=tokens;
            this.xrest=new XRest('https://api.vk.com/',{});

            this.logger.log('Starting always online mode...');
            await this.execute('account.setOnline');
            setInterval(async()=>{
                await this.execute('account.setOnline');
                this.logger.log('Updated online mode!');
            },60*1000*5);
            this.logger.log('Done!');
            await this.startReceiver();
        }catch(e){
            this.logger.error(e.stack);
            throw new Error('Error at auth()!');
        }
    }
    // execute - dummy method for typescript support
    @queue(600,3,'executeMulti')
    execute(method:string,params={}):Promise<any>{throw new Error('execute() was called, WTF?!')}
    tokenId=0;
    // executeMulti - wraps multiple calls into single execute method call
    async executeMulti(tasks:Array<[string,any]>){
        let code='return [';
        let tasksCodes:string[]=[];
        let needsToBeExecutedInSingle=false;
        tasks.forEach(([method,params])=>{
            if(EXECUTE_IN_SINGLE.includes(method))
                needsToBeExecutedInSingle=true;
            tasksCodes.push(`API.${method}(${JSON.stringify(params||{})})`);
        });
        code+=tasksCodes.join(',');
        code+='];';
        // return tasks.map(task=>'');
        let token=this.tokens[this.tokenId];
        this.tokenId++;
        if(this.tokenId===this.tokens.length)
            this.tokenId=0;
        if(needsToBeExecutedInSingle)
            token=this.uploadToken;
        let res=await this.xrest.emit(`POST /method/execute`,{data:{
            code
        },query:{
            v:'5.63',
            access_token:token
        }});
        let responses=res.body.response;
        if(res.body.error||!responses){
            if(res.body.error.error_code===14){
                // Process captcha
                // console.log(res.body.error.captcha_sid,res.body.error.captcha_img);
                // this.logger.warn('Waiting 15s for captcha skip...');
                // await new Promise(res=>setTimeout(()=>res(),15000));
                // return await this.executeMulti(tasks);
                // Add tasks to end
                return tasks.map(([method,params])=>{
                    return this.execute(method,params);
                });
            }else{
                return tasks.map((task,id)=>{
                    return new Error(res.body.error.error_msg);
                });
            }
        }else
            return tasks.map((task,id)=>{
                return responses[id];
            });
    }
    async getUser(user:any,onlyCached=false){
        return (await this.getUsers([user]))[0];
    }
    getUserFromApiData(data:any){
        let gender=0;
        switch(data.sex){
            case 1: gender=Gender.WOMAN;break;
            case 2: gender=Gender.MAN;break;
            default:gender=Gender.OTHER;
        }
        // Roles, config and state are managed by plugins
        let userConv=new User({
            messageId:null,
            api:this,
            uid:'VK.'+data.id,
            targetId:data.id,
            nickName:data.nickname||null,
            firstName:data.first_name,
            lastName:data.last_name,
            gender:gender,
            photoUrl:data.photo_max_orig,
            profileUrl:'https://vk.com/'+(data.domain||("id"+data.uid))
        });
        return userConv;
    }
    cache=new Map();
    @queue()
    async getUsers(users_orig:any) {
        let users = users_orig.slice(0);
        let MAX_EXECUTIONS_ONE_TIME = 1000;
        this.logger.debug('Before: ' + users.length);
        users=users.filter((user:any)=>!!user);
        users=users.filter((user:any)=>user>0); // TODO: Support groups
        this.logger.debug('After: ' + users.length);
        let result:any = [];
        while (users.length > 0) {
            this.logger.debug('Getting packet of users');
            let curDep = new Set();
            for (let i = 0; i < MAX_EXECUTIONS_ONE_TIME && users.length > 0; i++) {
                curDep.add(users.shift());
            }
            this.logger.debug('Getting cached');
            await asyncEach(curDep, async cur=> {
                let res = this.cache.get('VK:USER:'+cur);
                if (res) {
                    curDep.delete(cur);
                    result.push(this.getUserFromApiData(res));
                }
            });
            this.logger.debug('Total ' + Array.from(curDep).length + ' left to load');
            if (Array.from(curDep).length != 0) {
                this.logger.warn(`Uncached get user(s): ${Array.from(curDep).join(',')}`)
                let res = await this.execute('users.get', {
                    user_ids: Array.from(curDep).join(','),
                    fields: "photo_id,verified,sex,bdate,city,country,home_town,has_photo,photo_50,photo_100,photo_200_orig,photo_200,photo_400_orig,photo_max,photo_max_orig,online,lists,domain,has_mobile,contacts,site,education,universities,schools,status,last_seen,followers_count,common_count,occupation,nickname,relatives,relation,personal,connections,exports,wall_comments,activities,interests,music,movies,tv,books,games,about,quotes,can_post,can_see_all_posts,can_see_audio,can_write_private_message,can_send_friend_request,is_favorite,is_hidden_from_feed,timezone,screen_name,maiden_name,crop_photo,is_friend,friend_status,career,military,blacklisted,blacklisted_by_me"
                });
                await asyncEach(res, async r=> {
                    this.cache.set('VK:USER:' + r.id, r);
                });
                //result.push(...(await asyncEach(res,r=>this.getUserFromApiData(res))));
                result.push(...res.map(res=>{
                    let tres=this.getUserFromApiData(res);
                    return tres;
                }));
            }
            this.logger.debug('Loaded');
        }
        this.logger.debug('Total: ' + result.length);
        return result;
    }
    @queue()
    async getChat(chat){
        chat=chat.toString();
        let key='VK:CHAT:'+chat;
        let res = this.cache.get(key);
        if (!res) {
            this.logger.warn('Uncached get chat... (%s)',chat);
            res = await this.execute('messages.getChat', {
                chat_id: +chat
            });
            this.cache.set(key, res);
        }
        let data=res;
        const chatConv=new Chat({
            messageId: null,
            api:this,
            cid:'VKC.'+data.id,
            targetId:2e9+data.id,
            title:data.title,
            users:await this.getUsers(data.users),
            admins:[await this.getUser(data.admin_id)],
            photoUrl:data.photo_200});
        return chatConv;
    }
    async uGetUser(uid){
        if(!uid.startsWith('VK.'))
            return null;
        let id=uid.substr(3);
        if(!id)
            return null;
        id=+id;
        if(isNaN(id))
            return null;
        return await this.getUser(id);
    }
    async uGetChat(cid){
        if(!cid.startsWith('VKC.'))
            return null;
        let id=cid.substr(4);
        if(!id)
            return null;
        id=+id;
        if(isNaN(id))
            return null;
        return await this.getChat(id);
    }
    async startReceiver(){
        try {
            let data = await this.execute('messages.getLongPollServer',{});
            if(!data.server){
                this.logger.log(data);
                throw new Error('Can\'t get server!');
            }
            let {key, server, ts} = data;
            this.logger.log('Got receiver data');
            setTimeout(()=>this.receive(key,server,ts),1);
        }catch (e){
            this.logger.error(e);
            process.nextTick(()=>this.startReceiver());
        }
    }
    async parseAttachment(attachment){
        let result;
        switch(attachment.type){
            case 'photo':
                let max=Object.keys(attachment.photo).filter(a=>a.startsWith('photo_')).map(a=>+a.replace('photo_',''));
                result= await Image.fromUrl(attachment.photo['photo_'+max[max.length-1]]);
                break;
            case 'doc':
                result=await File.fromUrl(attachment.doc.url,attachment.doc.title);
                break;
            case 'video':
                //TODO: How to deal with video?
                break;
            case 'audio':
                result=new Audio(null,0,attachment.audio.artist,attachment.audio.title);
                break;
            default:
                this.logger.log(attachment);
        }
        if(result||attachment.type==='video')return result;
        else this.logger.error('Not got result for '+attachment.type);
    }
    async receive(key,server,ts){
        try {
            let result = (await emit(`GET https://${server}`,{
                query:{
                    act:'a_check',
                    key,
                    ts,
                    wait:25,
                    mode:66
                },
                timeout:0
            })).body;
            if (result.failed) {
                switch (result.failed) {
                    case 1:
                        ts = result.ts;
                        process.nextTick(()=>this.receive(key, server, ts));
                        return;
                    case 2:
                    case 3:
                        process.nextTick(()=>this.startReceiver());
                        return;
                    case 4:
                    default:
                        this.logger.err('Error on receive() call!'); //Should never been called
                        process.nextTick(()=>this.startReceiver());
                        return;
                }
            }
            ts = result.ts;
            let user=null;
            let chat=null;
            result.updates.forEach(async update=> {
                let that=this;
                try {
                    let type = update.shift();
                    let [flags,user_id,from_id,timestamp,subject,text,attachments,chat_id,message_id,peer_id,local_id,count,extra,mask]=
                        [null ,null   ,null   ,null     ,null   ,null,null       ,null   ,null      ,null   ,null    ,null ,null ,null];
                    switch (type) {
                        case 1:
                        case 2:
                        case 3: //Message flags
                            [message_id,flags,peer_id]=update;

                            break;
                        case 7:
                        case 6: //User read messages
                            [peer_id,local_id]=update;
                            if(peer_id>2e9)
                                this.getChat(peer_id-2e9);
                            else
                                this.getUser(peer_id);
                            break;
                        case 80: //Update unread count
                            [count]=update;
                            break;
                        case 8: {//User log in //TODO: Emit event
                            [user_id,extra]=update;
                            user_id=-user_id;
                            let user=await this.getUser(user_id);
                            this.emit('action',new ActionEvent({
                                user,
                                chat:null,
                                action:'offline',
                                data:extra
                            }));
                            break;
                        }
                        case 9: {//User log out //TODO: Emit event
                            [user_id,flags]=update;
                            user_id=-user_id;
                            let user=await this.getUser(user_id);
                            this.emit('action',new ActionEvent({
                                user,
                                chat:null,
                                action:'online',
                                data:flags
                            }));
                            break;
                        }
                        // case 61: {//Start writing in PM
                        //     [user_id,flags]=update;
                        //     try{
                        //         let [user]=await that.getUser(user_id);
                        //         that.emit('action',new ActionEvent({
                        //             user,
                        //             action:'writing',
                        //             data:flags
                        //         }));
                        //     }catch(e){
                        //         this.logger.error(e.stack);
                        //         this.logger.error('Strange error... Again.');
                        //     }
                        //     break;
                        // }
                        case 62: {//Start writing in Chat
                            [user_id,chat_id]=update;
                            let [user,chat]=await Promise.all([
                                this.getUser(user_id),
                                this.getChat(chat_id),
                                //this.bot.preloadUser('VK.' +user_id),
                                //this.bot.preloadChat('VKC.'+chat_id)
                            ]);
                            this.emit('action',new ActionEvent({
                                user,
                                chat,
                                action:'writing',
                                data:null
                            }));
                            break;
                        }
                        case 4: {//Normal message
                            [message_id,flags,from_id,timestamp,subject,text,attachments]=update;
                            //noinspection JSBitwiseOperatorUsage
                            //messages.getById?params[message_ids
                            let timing=new TimingData();
                            if(attachments.source_act){
                                let event,user,chat,initiator,initiatorP,userP,chatP;
                                switch(attachments.source_act){
                                    case 'chat_title_update':
                                        event=new TitleChangeEvent({oldTitle:attachments.source_old_text,newTitle:attachments.source_text,initiator:await this.getUser(attachments.from),chat:await this.getChat(from_id-2e9)});
                                        this.emit('title',event);
                                        break;
                                    case 'chat_invite_user':
                                        if(attachments.from===attachments.source_mid)
                                            initiatorP=null;
                                        else
                                            initiatorP=this.getUser(attachments.from);
                                        userP=this.getUser(attachments.source_mid);
                                        chatP=this.getChat(from_id-2e9);
                                        [user,chat,initiator]=await Promise.all([userP,chatP,initiatorP]);
                                        event=new JoinEvent({user,chat,initiator});
                                        this.emit('join',event);
                                        break;
                                    case 'chat_kick_user':
                                        initiatorP;
                                        if(attachments.from===attachments.source_mid)
                                            initiatorP=null;
                                        else
                                            initiatorP=this.getUser(attachments.from);
                                        userP=this.getUser(attachments.source_mid);
                                        chatP=this.getChat(from_id-2e9);
                                        [user,chat,initiator]=await Promise.all([userP,chatP,initiatorP]);
                                        event=new LeaveEvent({user,chat,initiator});
                                        this.emit('leave',event);
                                        break;
                                    default:
                                        this.logger.error('Unhandled event: '+attachments.source_act,attachments);

                                }
                                return;
                            }
                            if((flags&2)==2)//Dont catch self sended messages
                                return;
                            let realMessageNeeded=false;
                            if(attachments.geo||attachments.fwd||attachments.attach1_type)realMessageNeeded=true;
                            let realMessage;
                            let forwarded;
                            let attachment;
                            if(realMessageNeeded){
                                timing.start('Get real msg');
                                realMessage=(await this.execute('messages.getById',{
                                    message_ids:message_id
                                })).items[0];
                                timing.stop();
                            }
                            if(attachments.fwd){
                                timing.start('Parse forwarded')
                                let fwd=realMessage.fwd_messages[0];
                                forwarded=new ForwardedMessage({
                                    text:fwd.body,
                                    sender:await this.getUser(fwd.user_id),
                                    attachment:fwd.attachments?(await this.parseAttachment(fwd.attachments[0])):undefined
                                });
                                timing.stop();
                            }
                            if(attachments.geo){
                                timing.start('GeoDB');
                                let [lat,long] = realMessage.geo.coordinates.split(' ');
                                attachment=new Location(lat,long);
                                timing.stop();
                            }else if(realMessage&&realMessage.attachments){
                                timing.start('Real msg attachment')
                                attachment=await this.parseAttachment(realMessage.attachments[0]);
                                timing.stop();
                            }
                            timing.start('Getting sender');
                            //console.log(JSON.stringify(realMessage,null,4));
                            let sender_id=from_id>2e9?attachments.from:from_id;
                            // let sender=await this.getUser(sender_id);
                            let isChat=from_id>2e9;
                            let user=await this.getUser(sender_id);
                            if(user.targetId===undefined){
                                this.logger.warn('NullUser');
                                return;
                            }
                            timing.stop();
                            let message=new MessageEvent({
                                api:this,
                                attachment,
                                text:decodeText(text),
                                user,
                                chat:isChat?(await this.getChat(from_id-2e9)):undefined,
                                replyTo:forwarded,
                                messageId:message_id,
                                timing
                            });
                            message.user.messageId=message_id;
                            if(isChat)
                                message.chat.messageId=message_id;
                            timing.start('Adapter <=> Xbot transfer');
                            this.emit('message',message);
                            break;
                        }
                        default:
                            this.logger.err('Unhandled type: ' + type+', update is '+update);
                    }
                }catch (e){
                    this.logger.error('Error while processing update:');
                    this.logger.error(e);
                }
            });
            setTimeout(()=>this.receive(key, server, ts), 1);
        }catch (e){
            this.logger.error(e);
            setTimeout(()=>this.startReceiver(), 1);
        }
    }

    randomId(){
        return Math.round(Math.random() * 30000000);
    }

    static processText(text){
        return text.replace(/^ +/gm,e=>SPACE_REPLACE.repeat(e.length))//.replace(/ /g,SPACE_REPLACE);
    }

    //Implementing Api class methods
    async sendLocation(targetId,answer,caption,location,options){
        await this.execute("messages.send", {
            peer_id: targetId,
            message: VKApi.processText(caption),
            forward_messages: answer ? answer : "",
            random_id: this.randomId(),
            lat: location.lat,
            long: location.long
        });
    }
    async sendText(targetId,answer,text,options){
        await this.execute('messages.send', {
            peer_id: targetId,
            forward_messages: answer ? answer : "",
            message: VKApi.processText(text),
            random_id: this.randomId()
        });
    }

    async sendCommonAttachment(targetId,answer,caption,attachmentId,options) {
        await this.execute("messages.send", {
            peer_id: targetId,
            forward_messages: answer ? answer : "",
            message: VKApi.processText(caption),
            attachment: attachmentId,
            random_id: this.randomId()
        });
    }
    async sendImageStream(targetId,answer,caption,image,options){
        let server = await this.execute('photos.getMessagesUploadServer', {});
        let res=await emit(`POST ${server.upload_url}`,{
            multipart: true,
            timeout:50000,
            data: {
                photo: new multipart.FileStream(image.stream, image.name, image.size, 'binary', 'image/jpeg')
            }
        });
        let res2=await this.execute('photos.saveMessagesPhoto',{
            photo: res.body.photo,
            server: res.body.server,
            hash: res.body.hash
        });
        if(!res2[0])
            console.log(res2,res.body);
        await this.sendCommonAttachment(targetId,answer,VKApi.processText(caption),`photo${res2[0].owner_id}_${res2[0].id}`,options);
    }
    async sendFileStream(targetId,answer,caption,file,options){
        let server = await this.execute('docs.getUploadServer', {});
        let res=await emit(`POST ${server.upload_url}`,{
            multipart: true,
            timeout:50000,
            data: {
                file: new multipart.FileStream(file.stream, file.name, file.size, 'binary', 'text/plain')
            }
        });
        let res2=await this.execute('docs.save',{
            file: res.body.file,
            title: file.name
        });
        await this.sendCommonAttachment(targetId,answer,VKApi.processText(caption),`doc${res2[0].owner_id}_${res2[0].id}`,options);
    }
    async sendVoiceStream(targetId,answer,caption,file,options){
        let server = await this.execute('docs.getUploadServer', {
            type:'audio_message'
        });
        console.log(file.size,server);
        let res=await emit(`POST ${server.upload_url}`,{
            multipart: true,
            timeout:50000,
            data: {
                file: new multipart.FileStream(file.stream, '123.ogg', file.size, 'binary', 'text/plain')
            }
        });
        let res2=await this.execute('docs.save',{
            file: res.body.file,
            title:''
        });
        await this.sendCommonAttachment(targetId,answer,VKApi.processText(caption),`doc${res2[0].owner_id}_${res2[0].id}`,options);
    }
    async sendAudioStream(targetId:any,answer:any,caption:string,audio: Audio,options:any){
        throw new Error('sendAudioStream() not implemented!');
    }
    async sendCustom(targetId,answer,caption,options){
        if(options.ytVideo){
            let res1=await this.execute('video.save',{
                link: options.ytVideo
            });
            let res2=await emit('POST '+res1.upload_url);
            await this.sendCommonAttachment(targetId,answer,VKApi.processText(caption),`video${res1.owner_id}_${res1.video_id}`,options);
        }
    }
}
function decodeText(text) {
    return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<br>/g, '\n').replace(/&quot;/g, '"').replace(/«/g, '<<').replace(/»/g, '>>').replace(/—/g, '--');
}
