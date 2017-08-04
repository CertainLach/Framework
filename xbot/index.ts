import Logger from '@meteor-it/logger';
import {EventEmitter} from 'events';
import {getReadStream,stat,isFile} from '@meteor-it/fs';
import {emit} from '@meteor-it/xrest';
import {readStream,createReadStream} from '@meteor-it/utils';

const POSSIBLE_ACTIONS = ['writing'];
export default class XBot extends EventEmitter {
    apiList=[];
    constructor(name) {
        super();
        this.name = name;
        this.logger = new Logger(name);
    }
    attachApi(api) {
        if (!(api instanceof Api))
            throw new Error('"api" must me instance of Api!');
        if (!api.logged)
            throw new Error('You must call api.auth before adding them!');
        api.on('message', msg => this.onMessage(msg, api));
        api.on('title', msg => this.onTitle(msg, api));
        api.on('photo', msg => this.onPhoto(msg, api));
        api.on('join', msg => this.onJoin(msg, api));
        api.on('leave', msg => this.onLeave(msg, api));
        api.on('action', msg => this.onAction(msg, api));
        this.apiList.push(api);
    }
    onMessage(message, sourceApi) {
        message.sourceApi = sourceApi;
        message.attachXBot(this);
        let inChat = message.chat ? (` [${message.chat.title.red}]`) : '';
        let attachment = message.attachment ? (`A`.magenta) : ' ';
        let reply = message.replyTo ? (`R`.magenta) : ' ';
        this.logger.log(`<${message.user.firstName.blue} ${message.user.lastName.blue}${inChat}>[${attachment}${reply}] ${message.text.green}`);
        this.emit('message', message);
    }
    onLeave(leave, sourceApi) {
        leave.sourceApi = sourceApi;
        leave.attachXBot(this);
        let initiator = leave.initiator ? ` (by ${leave.initiator.firstName.blue} ${leave.initiator.lastName.blue})` : '';
        this.logger.log(`${leave.user.firstName.blue} ${leave.user.lastName.blue} {red}leaved{/red} ${leave.chat.title.red}${initiator}`);
        this.emit('leave', leave);
    }
    onJoin(join, sourceApi) {
        join.sourceApi = sourceApi;
        join.attachXBot(this);
        let initiator = join.initiator ? ` (by ${join.initiator.firstName.blue} ${join.initiator.lastName.blue})` : '';
        this.logger.log(`${join.user.firstName.blue} ${join.user.lastName.blue} {green}joined{/green} ${join.chat.title.red}${initiator}`);
        this.emit('join', join);
    }
    onAction(action, sourceApi) {
        action.sourceApi = sourceApi;
        action.attachXBot(this);
        let inChat = action.chat ? (` [${action.chat.title.red}]`) : '';
        this.logger.log(`${action.user.firstName.blue} ${action.user.lastName.blue}${inChat} - ${action.action.yellow}`);
        this.emit('action', action);
    }
    onPhoto(photo, sourceApi) {
        photo.sourceApi = sourceApi;
        photo.attachXBot(this);
        this.logger.log(`Changed photo in ${photo.chat.title.red} -> ${photo.newPhotoUrl} by ${photo.initiator.firstName} ${photo.initiator.lastName}`);
        this.emit('photo', photo);
    }
    onTitle(title, sourceApi) {
        title.sourceApi = sourceApi;
        title.attachXBot(this);
        this.logger.log(title.oldTitle.red + ' -> ' + title.newTitle.green + ' by ' + title.initiator.firstName + ' ' + title.initiator.lastName);
        this.emit('title', title);
    }
    async uGetUser(uid){
        let found=null;
        for(let i=0;i<this.apiList.length;i++){
            try{
                found=await this.apiList[i].uGetUser(uid);
                if(found)
                    break;
            }catch(e){}
        }
        return found;
    }
    async uGetChat(cid){
        let found=null;
        for(let i=0;i<this.apiList.length;i++){
            try{
                found=await this.apiList[i].uGetChat(cid);
                if(found)
                    break;
            }catch(e){}
        }
        return found;
    }
    onWaitNext(){
        this.logger.warn(`onWaitNext should be implemented in extender class!`);
    }
}

export class Api extends EventEmitter {
    name;
    logger;
    logged = false;

    constructor(name) {
        super();
        this.name = name;
        this.logger = new Logger(name);
    }
    async auth(...params) {
        throw new Error('auth() is not implemented in api!');
    }

    uGetUser(uid) {
        this.logger.error('uGetUser() is not implemented!');
        return null;
    }

    uGetChat(cid) {
        this.logger.error('uGetUser() is not implemented!');
        return null;
    }

    sendLocation(targetId, answer, caption, location, options) {
        throw new Error('sendLocation() not implemented!');
    }
    sendText(targetId, answer, text, options) {
        throw new Error('sendText() not implemented!');
    }
    sendImageStream(targetId, answer, caption, image, options) {
        throw new Error('sendImageStream() not implemented!');
    }
    sendFileStream(targetId, answer, caption, file, options) {
        throw new Error('sendFileStream() not implemented!');
    }
    sendAudioStream(targetId, answer, caption, audio, options) {
        throw new Error('sendAudioStream() not implemented!');
    }
    sendCustom(targetId, answer, options) {
        throw new Error('sendCustom() not implemented!');
    }
}

export class Location {
    lat;
    long;

    constructor(lat, long) {
        this.lat = lat;
        this.long = long;
    }
}

export class File {
    stream;
    size;
    name;
    size;
    constructor(stream, size, name) {
        if (isNaN(size))
            throw new Error('Wrong file size! ' + size);
        this.stream = stream;
        this.name = name;
        this.size = size;
    }
    async static fromBuffer(buffer, name){
        return new File(createReadStream(buffer), buffer.length, name);
    }
    async static fromUrl(url, name) {
        let res = await emit(`GET ${url} STREAM`);
        let size = res.headers['content-length'];
        return new File(res, size, name);
    }
    async static fromFilePath(path, name) {
        if (!await isFile(path))
            throw new Error('This is not a file! ' + path);
        let size = (await stat(path)).size;
        return new File(getReadStream(path), size, name);
    }
}

//TODO: Some services looks at extensions
export class Image extends File {
    constructor(stream, size) {
        super(stream, size, 'image.jpg');
    }
    async static fromUrl(url) {
        let res = await emit(`GET ${url}`);
        let size = parseInt(res.headers['content-length'], 10);
        return new Image(createReadStream(res.raw), size, 'image.jpg');
    }
    async static fromFilePath(path) {
        let size = (await stat(path)).size;
        return new Image(getReadStream(path), size, 'image.jpg');
    }
    async static fromCanvas(canvas) {
        let fullStream = canvas.jpegStream({
            bufsize: 4096,
            quality: 100,
            progressive: true
        });
        let buffer = await readStream(fullStream);
        return new Image(createReadStream(buffer), buffer.length, 'a.jpg');
    }
}
export class Audio extends File {
    constructor(stream, size, artist, title) {
        super(stream, size, `${artist} ${title}.mp3`);
    }
    async static fromUrl(url, artist, title) {
        let res = await emit(`GET ${url} STREAM`);
        let size = res.headers['content-length'];
        return new Image(res, size, `${artist} ${title}.mp3`);
    }
    async static fromFilePath(path, artist, title) {
        let size = (await stat(path)).size;
        return new Image(getReadStream(path), size, `${artist} ${title}.mp3`);
    }
}

export class Configuration {
    provider;
    type;
    id;
    constructor(provider, type, id) {
        this.provider = provider;
        this.type = type;
        this.id = id;
    }
    async save() {
        throw new Error('save() not implemented!');
    }
}

function assertAllIsDefined(...all) {
    for (let i of all) {
        if (i === undefined) {
            console.err(...all);
            throw new Error('Some variables is not defined!');
        }
    }
}

export class Role {
    static CREATOR = 1;
    static MODERATOR = 2;
    static USER = 3;
}
export class Gender {
    static MAN = 1;
    static WOMAN = 2;
    static OTHER = 3;
}

export class ForwardedMessage {
    text: string;
    sender: User;
    attachment: Audio|Image|File;

    constructor({
        text,
        sender,
        attachment
    }) {
        this.text = text;
        this.sender = sender;
        this.attachment = attachment;
    }
}

class Conversation {
    sourceApi:Api;
    api:any;
    targetId:any;
    messageId:any;

    constructor(api, targetId, messageId) {
        //assertAllIsDefined(api,targetId);
        this.api = api;
        this.targetId = targetId;
        this.messageId = messageId;
    }

    async sendLocation(answer, caption, location, options = {}) {
        if (!(location instanceof Location))
            throw new Error('"location" is not a instance of Location!');
        if(this.xbot){
            let inChat = (this instanceof Chat) ? (` [${this.title.red}]`) : '';
            let attachment = true ? (`A`.magenta) : ' ';
            let reply = answer ? (`R`.magenta) : ' ';
            this.xbot.logger.log(`<${'Ayzek'.blue} ${'Azimov'.blue}${inChat}>[${attachment}${reply}] ${(caption||'').green}`);
        }
        return await this.api.sendLocation(this.targetId, answer, caption, location, options);
    }
    async sendText(answer, text, options = {}) {
        if(this.xbot){
            let inChat = (this instanceof Chat) ? (` [${this.title.red}]`) : '';
            let attachment = false ? (`A`.magenta) : ' ';
            let reply = answer ? (`R`.magenta) : ' ';
            this.xbot.logger.log(`<${'Ayzek'.blue} ${'Azimov'.blue}${inChat}>[${attachment}${reply}] ${text.green}`);
        }
        return await this.api.sendText(this.targetId, answer ? this.messageId : undefined, text, options);
    }
    async sendImage(answer, caption, image, options = {}) {
        if (!(image instanceof Image))
            throw new Error('"image" is not a instance of Image!');
        if(this.xbot){
            let inChat = (this instanceof Chat) ? (` [${this.title.red}]`) : '';
            let attachment = true ? (`A`.magenta) : ' ';
            let reply = answer ? (`R`.magenta) : ' ';
            this.xbot.logger.log(`<${'Ayzek'.blue} ${'Azimov'.blue}${inChat}>[${attachment}${reply}] ${(caption||'').green}`);
        }
        return await this.api.sendImageStream(this.targetId, answer ? this.messageId : undefined, caption, image, options);
    }
    async sendFile(answer, caption, file, options = {}) {
        if (!(file instanceof File))
            throw new Error('"file" is not a instance of File!');
        if(this.xbot){
            let inChat = (this instanceof Chat) ? (` [${this.title.red}]`) : '';
            let attachment = true ? (`A`.magenta) : ' ';
            let reply = answer ? (`R`.magenta) : ' ';
            this.xbot.logger.log(`<${'Ayzek'.blue} ${'Azimov'.blue}${inChat}>[${attachment}${reply}] ${(caption||'').green}`);
        }
        return await this.api.sendFileStream(this.targetId, answer, caption, file, options);
    }
    async sendAudio(answer, caption, audio, options = {}) {
        if (!(audio instanceof Audio))
            throw new Error('"audio" is not a instance of Audio!');
        if(this.xbot){
            let inChat = (this instanceof Chat) ? (` [${this.title.red}]`) : '';
            let attachment = true ? (`A`.magenta) : ' ';
            let reply = answer ? (`R`.magenta) : ' ';
            this.xbot.logger.log(`<${'Ayzek'.blue} ${'Azimov'.blue}${inChat}>[${attachment}${reply}] ${(caption||'').green}`);
        }
        return await this.api.sendAudioStream(this.targetId, answer, caption, audio, options);
    }
    async sendVoice(answer, caption, file, options = {}){
        if (!(file instanceof File))
            throw new Error('"file" is not a instance of File!');
        if(this.xbot){
            let inChat = (this instanceof Chat) ? (` [${this.title.red}]`) : '';
            let attachment = true ? (`A`.magenta) : ' ';
            let reply = answer ? (`R`.magenta) : ' ';
            this.xbot.logger.log(`<${'Ayzek'.blue} ${'Azimov'.blue}${inChat}>[${attachment}${reply}]`);
        }
        return await this.api.sendVoiceStream(this.targetId, answer, caption, file, options);
    }
    async sendCustom(answer, caption, options = {}) {
        return await this.api.sendCustom(this.targetId, answer, caption, options);
    }
}
export class User extends Conversation {
    uid:string;
    nickName:string;
    firstName:string;
    lastName:string;
    gender: Gender;
    photoUrl: string;
    role: Role;
    config: any;
    state: any;
    profileUrl: string;
    isUser=true;
    isChat=false;
    xbot: XBot;

    constructor({
        api,
        uid,
        targetId,
        nickName = null,
        firstName,
        lastName,
        gender,
        photoUrl,
        role = Role.USER,
        profileUrl,
        messageId
    }) {
        //assertAllIsDefined(api,uid,targetId,firstName,lastName,gender,photoUrl,config,state,profileUrl);
        super(api, targetId, messageId);
        this.uid = uid;
        this.nickName = nickName;
        this.firstName = firstName;
        this.lastName = lastName;
        this.gender = gender;
        this.photoUrl = photoUrl;
        this.profileUrl = profileUrl;
    }
    async getPhotoImage() {
        return await Image.fromUrl(this.photoUrl);
    }
    getName(){
        if(this.nickName)
            return this.nickName;
        else
            return this.firstName;
    }
    getFullName(){
        let name='';
        if(this.firstName)
            name+=this.firstName+' ';
        if(this.lastName)
            name+=this.lastName+' ';
        if(this.nickName)
            name+=`(${this.nickName}) `;
        return name.trim();
    }
    waitNew(...args){
        return this.xbot.onWaitNext(this,...args);
    }
}
export class Chat extends Conversation {
    cid:string;
    users:User[];
    title:string;
    admins:User[];
    photoUrl:string;
    isUser=false;
    isChat=true;
    xbot: XBot;

    constructor({
        api,
        cid,
        targetId,
        title,
        users,
        admins,
        messageId,
        photoUrl
    }) {
        //assertAllIsDefined(api,cid,targetId,title,users,admins,photoUrl,config,state);
        super(api, targetId, messageId);
        this.cid = cid;
        this.users = users;
        this.title = title;
        this.admins = admins;
        this.photoUrl = photoUrl;
    }
    isAdmin(user) {
        return ~this.admins.indexOf(user) || user.role === Role.CREATOR;
    }
    async getPhotoImage() {
        return await Image.fromUrl(this.photoUrl);
    }
    waitNew(...args){
        return this.xbot.onWaitNext(this,...args);
    }
}
export class MessageEvent extends Conversation {
    attachment: File|Audio|Image;
    text: string;
    user: User;
    chat: Chat;
    replyTo: ForwardedMessage;
    xbot: XBot;
    get isChat(){
        return !!this.chat;
    }
    isUser=true;
    constructor({
        api,
        attachment,
        text,
        user,
        chat,
        messageId,
        replyTo = null
    }) {
        //assertAllIsDefined(api,mid,attachment,text,user,chat);
        super(api, chat ? chat.targetId : user.targetId, messageId);
        this.attachment = attachment;
        this.text = text;
        this.user = user;
        this.chat = chat;
        this.replyTo = replyTo;
    }
    attachXBot(xbot){
        this.xbot=xbot;
        if(this.chat)
            this.chat.xbot=xbot;
        this.user.xbot=xbot;
    }
}
export class JoinEvent {
    sourceApi: Api;
    user: User;
    chat: Chat;
    initiator: User;
    xbot: XBot;

    constructor({
        user,
        chat,
        initiator = null
    }) {
        //assertAllIsDefined(user,chat);
        this.user = user;
        this.chat = chat;
        this.initiator = initiator;
    }
    attachXBot(xbot){
        this.xbot=xbot;
        this.chat.xbot=xbot;
        this.user.xbot=xbot;
        if(this.initiator)
            this.initiator.xbot=xbot;
    }
}
export class ActionEvent {
    sourceApi: Api;
    user: User;
    chat: Chat;
    action: string;
    data: any;
    xbot: XBot;

    constructor({
        user,
        action,
        chat = null,
        data = null
    }) {
        //assertAllIsDefined(user);
        this.action = action;
        this.user = user;
        this.chat = chat;
        this.data = data;
    }
    attachXBot(xbot){
        this.xbot=xbot;
        if(this.chat)
            this.chat.xbot=xbot;
        this.user.xbot=xbot;
    }
}
export class LeaveEvent {
    sourceApi: Api;
    user: User;
    chat: Chat;
    initiator: User;
    xbot: XBot;

    constructor({
        user,
        chat,
        initiator = null
    }) {
        //assertAllIsDefined(user,chat);
        this.user = user;
        this.chat = chat;
        this.initiator = initiator;
    }
    attachXBot(xbot){
        this.xbot=xbot;
        this.chat.xbot=xbot;
        this.user.xbot=xbot;
    }
}

export class TitleChangeEvent {
    sourceApi: Api;
    newTitle: string;
    oldTitle: string;
    initiator: User;
    chat: Chat;
    xbot: XBot;

    constructor({
        oldTitle,
        newTitle,
        initiator,
        chat
    }) {
        //assertAllIsDefined(newTitle,initiator,chat);
        this.oldTitle = oldTitle;
        this.newTitle = newTitle;
        this.initiator = initiator;
        this.chat = chat;
    }
    attachXBot(xbot){
        this.xbot=xbot;
        this.chat.xbot=xbot;
        this.user.xbot=xbot;
    }
}
export class PhotoChangeEvent {
    sourceApi: Api;
    newPhotoUrl: string;
    initiator: User;
    chat: Chat;
    xbot: XBot;

    constructor({
        newPhotoUrl,
        initiator,
        chat
    }) {
        //assertAllIsDefined(newPhotoUrl,initiator,chat);
        this.newPhotoUrl = newPhotoUrl;
        this.initiator = initiator;
        this.chat = chat;
    }
    attachXBot(xbot){
        this.xbot=xbot;
        this.chat.xbot=xbot;
        this.initiator.xbot=xbot;
    }
}