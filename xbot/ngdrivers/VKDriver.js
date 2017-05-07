import VKApi from "./api/VKApi";
import Driver from "./Driver";
import NGRest from "../framework/sources/NGRest";
import LocationAttachment from "./attachments/LocationAttachment";
import NGCache from "../framework/NGCache";
import {mixin} from "../framework/OOPHelpers";
import {SEX} from "./Bases/User";
import Conversation from "./Bases/Conversation";
import Message from "./Bases/Message";
import Chat from "./Bases/Chat";
import User from "./Bases/User";
import {asyncEach} from "../framework/AsyncUtils";
import {PLATFORM} from "./Bases/User";
import {queue} from "../framework/Queuer";
/**
 * Created by Creeplays on 15.08.2016.
 */
export default class VKDriver extends Driver{
    constructor(bot){
        super(bot,'vk',new VKApi(bot));
    }
    async auth(token){
        this.api.auth(token);
        try {
            this.logger.log('Queuing online mode...');
            await this.api.execute('account.setOnline');
            setInterval(async()=>await this.api.execute('account.setOnline'),60*1000*5);
        }catch(e){}
    }
    async startReceiver(){
        try {
            let data = await this.api.execute('messages.getLongPollServer');
            console.log('res: '+data);
            let {key, server, ts} = data;
            this.logger.log('Got receiver data');
            setTimeout(()=>this.receive(key,server,ts),1);
        }catch (e){
            console.error(e);
        }
    }
    async getUser(user,onlyCached=false){
        user=user.toString();
        if(user.startsWith('VK.'))
            user=user.substr(3);
        let key='VK:USER:'+user;
        let res = await NGCache.get(key);
        if (!res) {
            if(onlyCached)
                return null;
            this.logger.debug('Uncached get user...');
            res = await this.api.execute('users.get', {
                user_id: user,
                fields: "photo_id,verified,sex,bdate,city,country,home_town,has_photo,photo_50,photo_100,photo_200_orig,photo_200,photo_400_orig,photo_max,photo_max_orig,online,lists,domain,has_mobile,contacts,site,education,universities,schools,status,last_seen,followers_count,common_count,occupation,nickname,relatives,relation,personal,connections,exports,wall_comments,activities,interests,music,movies,tv,books,games,about,quotes,can_post,can_see_all_posts,can_see_audio,can_write_private_message,can_send_friend_request,is_favorite,is_hidden_from_feed,timezone,screen_name,maiden_name,crop_photo,is_friend,friend_status,career,military,blacklisted,blacklisted_by_me"
            });
            res = res[0];
            await NGCache.set(key, res);
        }
        let data=res;
        return VKDriver.getUserFromApiData(data,this);
    }
    static getUserFromApiData(data,adapter){
        let userConv=new VKUser();
        if(!data)
            return undefined;
        if(!data.first_name)
            return undefined;
        userConv.fn=data.first_name;
        userConv.ln=data.last_name;
        userConv.nn=data.nickname;
        userConv.uid='VK.'+data.id;
        if(data.sex==1)
            userConv.sex=SEX.FEMALE;
        else if(data.sex==2)
            userConv.sex=SEX.MALE;
        else
            userConv.sex=SEX.ANIMAL;
        userConv.avatar=data.photo_max_orig;
        userConv.profileLink='https://vk.com/'+(data.domain||"id"+data.uid);
        userConv.peer=data.id;
        userConv.adapter=adapter;
        return userConv;
    }
    @queue()
    async getUsers(users_orig) {
        let users = users_orig.slice(0);
        let MAX_EXECUTIONS_ONE_TIME = 1000;
        this.logger.debug('Before: ' + users.length);
        users.filter(user=>!!user);
        this.logger.debug('After: ' + users.length);
        let result = [];
        while (users.length > 0) {
            this.logger.debug('Getting packet of users');
            let curDep = new Set();
            for (let i = 0; i < MAX_EXECUTIONS_ONE_TIME && users.length > 0; i++) {
                curDep.add(users.shift());
            }
            this.logger.debug('Getting cached');
            await asyncEach(curDep, async cur=> {
                let res = await this.getUser(cur, true);
                if (res) {
                    curDep.delete(cur);
                    result.push(res);
                }
            });
            this.logger.debug('Total ' + Array.from(curDep).length + ' left to load');
            if (Array.from(curDep).length != 0) {
                let res = await this.api.execute('users.get', {
                    user_ids: Array.from(curDep).join(','),
                    fields: "photo_id,verified,sex,bdate,city,country,home_town,has_photo,photo_50,photo_100,photo_200_orig,photo_200,photo_400_orig,photo_max,photo_max_orig,online,lists,domain,has_mobile,contacts,site,education,universities,schools,status,last_seen,followers_count,common_count,occupation,nickname,relatives,relation,personal,connections,exports,wall_comments,activities,interests,music,movies,tv,books,games,about,quotes,can_post,can_see_all_posts,can_see_audio,can_write_private_message,can_send_friend_request,is_favorite,is_hidden_from_feed,timezone,screen_name,maiden_name,crop_photo,is_friend,friend_status,career,military,blacklisted,blacklisted_by_me"
                });
                await asyncEach(res, async r=> {
                    //console.log(r);
                    await NGCache.set('VK:USER:' + r.id, r);
                });
                result.push(...res.map(res=>VKDriver.getUserFromApiData(res, this)));
            }
            this.logger.debug('Loaded');
        }
        this.logger.debug('Total: ' + result.length);
        return result;
    }
    @queue(10)
    async getChat(chat){
        chat=chat.toString();
        if(chat.startsWith('VKC.'))
            chat=chat.substr(4);
        let key='VK:CHAT:'+chat;
        let res = await NGCache.get(key);
        if (!res) {
            this.logger.debug('Uncached get chat...');
            res = await this.api.execute('messages.getChat', {
                chat_id: +chat
            });
            await NGCache.set(key, res);
        }
        let data=res;
        let chatObj=new VKChat();
        chatObj.members=await this.getUsers(data.users);
        chatObj.photo=data.photo_200;
        chatObj.title=data.title;
        chatObj.uid='VKC.'+chat;
        chatObj.peer=chat+2e9;
        chatObj.adapter=this;
        return chatObj;
    }
    async receive(key,server,ts){
        try {
            let result = await NGRest.get(`https://${server}?act=a_check&key=${key}&ts=${ts}&wait=25&mode=66`);
            if (result.failed) {
                switch (result.failed) {
                    case 1:
                        ts = result.ts;
                        setTimeout(()=>this.receive(key, server, ts), 1);
                        return;
                    case 2:
                    case 3:
                        setTimeout(()=>this.startReceiver(), 1);
                        return;
                    case 4:
                    default:
                        this.logger.err('Error on receive() call!'); //Should never been called
                        setTimeout(()=>this.startReceiver(), 1);
                        return;
                }
            }
            ts = result.ts;
            result.updates.forEach(async update=> {
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
                        case 8: //User log in //TODO: Emit event
                            [user_id,extra]=update;
                            user_id=-user_id;
                            this.getUser(user_id);
                            break;
                        case 9: //User log out //TODO: Emit event
                            [user_id,flags]=update;
                            user_id=-user_id;
                            this.getUser(user_id);
                            break;
                        case 61: //Start writing in PM
                            [user_id,flags]=update;
                            await Promise.all([
                                this.getUser(user_id),
                                this.bot.preloadUser('VK.'+user_id)
                            ]);
                            break;
                        case 62: //Start writing in Chat
                            [user_id,chat_id]=update;
                            await Promise.all([
                                this.getUser(user_id),
                                this.getChat(chat_id),
                                this.bot.preloadUser('VK.' +user_id),
                                this.bot.preloadChat('VKC.'+chat_id)
                            ]);
                            break;
                        case 4: //Normal message
                            [message_id,flags,from_id,timestamp,subject,text,attachments]=update;
                            //noinspection JSBitwiseOperatorUsage
                            if((flags&2)==2)
                                return;
                            let parsedAttachments = [];
                            if (attachments.geo) {
                                let messages = await this.api.execute('messages.getById', {
                                    message_ids: message_id
                                });
                                let [lat,long] = messages.items[0].geo.coordinates.split(' ');
                                parsedAttachments.push(new LocationAttachment(lat,long));
                            }
                            let sender_id=from_id>2e9?attachments.from:from_id;
                            let sender=await this.getUser(sender_id);
                            let isChat=from_id>2e9;
                            let msgObj=new VKMessage();
                            let chat=null;
                            if(isChat){
                                chat=await this.getChat(from_id-2e9);
                            }
                            msgObj.sender=sender;
                            msgObj.chat=chat;
                            msgObj.attachments=parsedAttachments;
                            msgObj.text=text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                                .replace(/<br>/g, '\n').replace(/&quot;/g, '"').replace(/«/g, '<<')
                                .replace(/»/g, '>>').replace(/—/g, '--');
                            msgObj.peer=from_id;
                            msgObj.forward=message_id;
                            msgObj.adapter=this;
                            await this.bot.gotMessage(msgObj);
                            break;
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
}

class VKConversation extends Conversation{
    constructor(){
        super('VK');
    }
    async sendPhoto(photo,message,answer,options={}){
        let server = await this.adapter.api.execute('photos.getMessagesUploadServer');
        let uploaded = await NGRest.post(server.upload_url, {
            multipart: true,
            data: {
                photo: await NGRest.getFile(photo, 'image/jpeg','photo.jpeg')
            }
        });
        let photoData=await this.adapter.api.execute('photos.saveMessagesPhoto', {
            photo: uploaded.photo,
            server: uploaded.server,
            hash: uploaded.hash
        });
        photoData=photoData[0];
        options.attachment=`photo${photoData.owner_id}_${photoData.id}`;
        return await this.sendText(message,answer,options);
    }
    async sendText(message,answer,options={}){
        var parts = message.match(/[\s\S]{1,400}/g) || [];
        if(parts.length>1){
            let i=0;
            await asyncEach(parts,part=>{
                if(i==parts.length-1)
                    this.sendText(part,answer,options);
                else
                    this.sendText(part,false,options);
                i++;
            });
            return;
        }
        try {
            let res = await this.adapter.api.execute('messages.send', {
                peer_id: this.peer,
                message: message,
                forward_messages: answer ? this.forward : undefined,
                random_id: Math.round(Math.random()*12000),
                attachment: options.attachment?options.attachment:undefined
            });
        }catch (e){
            console.log(e);
        }
    }
    async sendFile(file,message,answer,options={}){
        console.log('File');
    }
    async sendAction(type){
        await this.adapter.api.execute("messages.setActivity", {
            type: "typing",
            peer_id: this.peer
        });
    }
}

class VKMessage extends Message{
    constructor(){super();}
}
class VKChat extends Chat{
    constructor(){super();}
}
class VKUser extends User{
    constructor(){super();}
}
mixin(VKMessage,VKConversation,Conversation.props);
mixin(VKChat,VKConversation,Conversation.props);
mixin(VKUser,VKConversation,Conversation.props);

const VK_PLATFORM ={
    1:PLATFORM.MOBILE,
    2:PLATFORM.IPHONE,
    3:PLATFORM.IPAD,
    4:PLATFORM.ANDROID,
    5:PLATFORM.WPHONE,
    6:PLATFORM.WINDOWS,
    8:PLATFORM.WEB
};

// mixin(VKConversation,VKMessage.prototype);
// mixin(VKConversation,VKChat.prototype);
// mixin(VKConversation,VKUser.prototype);
