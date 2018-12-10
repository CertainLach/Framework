import { Api, User, Chat, MessageEvent,/*ForwardedMessage,*/Gender,/*Location,Image,File,Audio,TitleChangeEvent,JoinEvent,LeaveEvent,ActionEvent*/ } from "../";
/*import XRest from "@meteor-it/xrest";
import * as multipart from '@meteor-it/xrest/multipart';*/
import {/*readStream,*/sleep } from '@meteor-it/utils';
import { Client/*, User as DiscordUser, Channel as DiscordChannel*/ } from 'discord.js';

const SPACE_REPLACE = String.fromCharCode(8194);

export default class DSApi extends Api {
    logged = false;
    client: Client;
    constructor() {
        super('DSAPI');
    }
    async auth(token: string) {
        const client = new Client();
        client.login(token);
        this.client = client;
        this.logger.log('Logged in');
        this.logged = true;
        this.startReceiver();
    }
    // async parseAttachment(type:any, obj:any) {
    //
    // }
    async startReceiver() {
        this.client.on('message', (message: any) => {
            let user = this.getUserFromApiData(message.author);
            let chat = message.channel;
            if (message.guild)
                chat = this.getChatFromApiData(chat, message.guild);
            let isChat = !!chat;
            let msgEvent = new MessageEvent({
                api: this,
                text: message.content,
                user: user,
                chat: isChat ? chat : undefined,
                replyTo: undefined,
                messageId: message.id,
                attachment: undefined
            });
            msgEvent.user.messageId = message.id;
            if (msgEvent.chat)
                msgEvent.chat.messageId = message.id;
            this.emit('message', msgEvent);
        });
    }
    async uGetUser(uid: string): Promise<User> {
        throw new Error('WIP');
        // if(!uid.startsWith('TGC.'))
        //     return null;
        // let id=uid.substr(3);
        // if(!id)
        //     return null;
        // id=+id;
        // if(isNaN(id))
        //     return null;
        // return await this.getUserFromApiData({
        //     id,
        //     username:'I',
        //     first_name:'Hate',
        //     last_name:'Telegram API',
        // });
    }
    async uGetChat(cid: string): Promise<Chat> {
        throw new Error('WIP');
        // if(!cid.startsWith('TGC.'))
        //     return null;
        // let id=cid.substr(4);
        // if(!id)
        //     return null;
        // id=+id;
        // if(isNaN(id))
        //     return null;
        // return await this.getChat(id);
    }
    photoCache = new Map();
    getUserFromApiData(data: any) {
        return new User({
            messageId: null,
            api: this,
            uid: 'DS.' + data.id,
            targetId: data,
            nickName: data.username,
            firstName: data.username,
            lastName: '',
            gender: Gender.MAN,
            photoUrl: data.displayAvatarURL,
            profileUrl: 'netu ego, hы'
        });
    }
    getChatFromApiData(data: any, guild: any) {
        return new Chat({
            messageId: null,
            api: this,
            cid: 'DSC.' + data.id,
            targetId: data,
            title: data.topic || data.name,
            users: guild.members.array().map((member: any) => this.getUserFromApiData(member)),
            admins: [],
            photoUrl: guild.iconURL
        });
    }
    async sendLocation(targetId: any, answer: any, caption: any, location: any, options: any) {

    }


    static *limitTextString(text: string): IterableIterator<string> {
        let strings = text.split(' \n');
        let currentString = '';
        while (true) {
            if (strings.length === 0) {
                if (currentString !== '')
                    yield currentString;
                return null;
            }
            if (currentString.length + strings[0].length >= 2000) {
                yield currentString;
                currentString = '';
            }
            currentString += strings.shift() + '\n';
        }
    }
    async sendText(targetId: any, answer: any, text: any, options: any) {
        for (let textPart of DSApi.limitTextString(SPACE_REPLACE + '\n' + text)) {
            if (textPart !== null) {
                await targetId.send(textPart);
                await sleep(500);
            }
        }
    }

    async sendImageStream(targetId: any, answer: any, caption: any, image: any, options: any) {
        // image.stream.path='aaaaa.jpeg';
        // await this.bot.sendPhoto(targetId, image.stream, {
        //     reply_to_message_id:answer,
        //     caption
        // });
    }
    async sendFileStream(targetId: any, answer: any, caption: any, file: any, options: any) {

    }
    async sendAudioStream(targetId: any, answer: any, caption: any, audio: any, options: any) {

    }
    async sendCustom(targetId: any, answer: any, options: any) { }
}