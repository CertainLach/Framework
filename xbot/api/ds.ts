import {Api,User,Chat,MessageEvent,ForwardedMessage,Gender,Location,Image,File,Audio,TitleChangeEvent,JoinEvent,LeaveEvent,ActionEvent} from "../";
import XRest from "@meteor-it/xrest";
import * as multipart from '@meteor-it/xrest/multipart';
import {readStream,sleep} from '@meteor-it/utils';
import {Client, User as DiscordUser, Channel as DiscordChannel} from 'discord.js';

const SPACE_REPLACE=String.fromCharCode(8194);

export default class DSApi extends Api {
    logged = false;
    client: Client;
    constructor() {
        super('DSAPI');
    }
    async auth(token) {
        const client = new Client();
        client.login(token);
        this.client = client;
        this.logger.log('Logged in')
        this.logged = true;
        this.startReceiver();
    }
    async parseAttachment(type, obj) {

    }
    async startReceiver() {
        this.client.on('message', message => {
            let user = this.getUserFromApiData(message.author)
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
                messageId: message.id
            });
            msgEvent.user.messageId = message.id;
            if (msgEvent.chat)
                msgEvent.chat.messageId = message.id;
            this.emit('message', msgEvent);
        });
    }
    async uGetUser(uid: string): Promise < User > {
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
    async uGetChat(cid: string): Promise < Chat > {
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
    getUserFromApiData(data) {
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
    getChatFromApiData(data, guild) {
        return new Chat({
            messageId: null,
            api: this,
            cid: 'DSC.' + data.id,
            targetId: data,
            title: data.topic || data.name,
            users: guild.members.array().map(member => this.getUserFromApiData(member)),
            admins: [],
            photoUrl: guild.iconURL
        });
    }
    async sendLocation(targetId, answer, caption, location, options) {

    }


    * limitTextString(text) {
        let strings = text.split(' \n');
        let currentString = '';
        while (true) {
            if (strings.length === 0) {
                if (currentString !== '')
                    yield currentString;
                return;
            }
            if (currentString.length + strings[0].length >= 2000) {
                yield currentString;
                currentString = '';
            }
            currentString += strings.shift() + '\n';
        }
    }
    async sendText(targetId, answer, text, options) {
        for (let textPart of this.limitTextString(SPACE_REPLACE + '\n' + text)) {
            await targetId.send(textPart);
            await sleep(500);
        }
    }

    async sendImageStream(targetId, answer, caption, image, options) {
        // image.stream.path='aaaaa.jpeg';
        // await this.bot.sendPhoto(targetId, image.stream, {
        //     reply_to_message_id:answer,
        //     caption
        // });
    }
    async sendFileStream(targetId, answer, caption, file, options) {

    }
    async sendAudioStream(targetId, answer, caption, audio, options) {

    }
    async sendCustom(targetId, answer, options) {}
}