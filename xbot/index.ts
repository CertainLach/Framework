import Logger from '@meteor-it/logger';
import {EventEmitter} from 'events';
import {getReadStream,stat,isFile} from '@meteor-it/fs';
import {emit} from '@meteor-it/xrest';
import {readStream,createReadStream} from '@meteor-it/utils';
import {Readable} from 'stream';

const POSSIBLE_ACTIONS = ['writing'];
export default class XBot extends EventEmitter {
    logger: Logger;
    name: string;
    apiList=[];
    constructor(name:string) {
        super();
        this.name = name;
        this.logger = new Logger(name);
    }
    attachApi(api:Api) {
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
    onMessage(message: MessageEvent, sourceApi: Api) {
        message.sourceApi = sourceApi;
        message.attachXBot(this);
        let inChat = message.chat ? (` [${message.chat.title.red}]`) : '';
        let attachment = message.attachment ? (`A`.magenta) : ' ';
        let reply = message.replyTo ? (`R`.magenta) : ' ';
        this.logger.log(`<${message.user.firstName.blue} ${message.user.lastName.blue}${inChat}>[${attachment}${reply}] ${message.text.green}`);
        this.emit('message', message);
    }
    onLeave(leave: LeaveEvent, sourceApi: Api) {
        leave.sourceApi = sourceApi;
        leave.attachXBot(this);
        let initiator = leave.initiator ? ` (by ${leave.initiator.firstName.blue} ${leave.initiator.lastName.blue})` : '';
        this.logger.log(`${leave.user.firstName.blue} ${leave.user.lastName.blue} {red}leaved{/red} ${leave.chat.title.red}${initiator}`);
        this.emit('leave', leave);
    }
    onJoin(join: JoinEvent, sourceApi: Api) {
        join.sourceApi = sourceApi;
        join.attachXBot(this);
        let initiator = join.initiator ? ` (by ${join.initiator.firstName.blue} ${join.initiator.lastName.blue})` : '';
        this.logger.log(`${join.user.firstName.blue} ${join.user.lastName.blue} {green}joined{/green} ${join.chat.title.red}${initiator}`);
        this.emit('join', join);
    }
    onAction(action: ActionEvent, sourceApi: Api) {
        action.sourceApi = sourceApi;
        action.attachXBot(this);
        let inChat = action.chat ? (` [${action.chat.title.red}]`) : '';
        this.logger.log(`${action.user.firstName.blue} ${action.user.lastName.blue}${inChat} - ${action.action.yellow}`);
        this.emit('action', action);
    }
    onPhoto(photo: PhotoChangeEvent, sourceApi: Api) {
        photo.sourceApi = sourceApi;
        photo.attachXBot(this);
        this.logger.log(`Changed photo in ${photo.chat.title.red} -> ${photo.newPhotoUrl} by ${photo.initiator.firstName} ${photo.initiator.lastName}`);
        this.emit('photo', photo);
    }
    onTitle(title: TitleChangeEvent, sourceApi: Api) {
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

class NotImplementedInApiError extends Error{
    constructor(method){
        super('Not implemented in api: '+method+'()');
    }
}

export class Api extends EventEmitter {
    name: string;
    logger: Logger;
    logged:boolean = false;

    constructor(name: string) {
        super();
        this.name = name;
        this.logger = new Logger(name);
    }
    auth(...params:any[]): Promise<void>{
        throw new NotImplementedInApiError('auth');
    }
    uGetUser(uid:string): Promise<User>{
        throw new NotImplementedInApiError('uGetUser');
    }
    uGetChat(cid:string): Promise<Chat>{
        throw new NotImplementedInApiError('uGetChat');
    }
    sendLocation(targetId: any, answer: any, caption: string,location: Location,options:any): Promise<void>{
        throw new NotImplementedInApiError('sendLocation');
    }
    sendText(targetId: any, answer: any, text: string, options:any): Promise<void>{
        throw new NotImplementedInApiError('sendText');
    }
    sendImageStream(targetId: any, answer: any, caption:string, image:Image, options:any): Promise<void>{
        throw new NotImplementedInApiError('sendImageStream');
    }
    sendFileStream(targetId: any, answer:any, caption:string, file:File, options:any): Promise<void>{
        throw new NotImplementedInApiError('sendFileStream');
    }
    sendAudioStream(targetId: any, answer: any, caption:string, audio:Audio, options:any): Promise<void>{
        throw new NotImplementedInApiError('sendAudioStream');
    }
    sendCustom(targetId: any, answer: any, caption:string, options: any): Promise<void>{
        throw new NotImplementedInApiError('sendCustom');
    }
}

export class Location {
    lat: number;
    long: number;

    constructor(lat, long) {
        this.lat = lat;
        this.long = long;
    }
}

class BaseFile {
    stream: Readable;
    size: number;
    name: string;
    constructor(stream, size, name){
        if (isNaN(size))
            throw new Error('Wrong file size! ' + size);
        this.stream = stream;
        this.name = name;
        this.size = size;
    }
}

export class File extends BaseFile {
    mime;
    constructor(stream, size, name, mime) {
        super(stream, size, name = 'text/plain');
        this.mime=mime;
    }
    static async fromBuffer(buffer, name) {
        return new File(createReadStream(buffer), buffer.length, name);
    }
    static async fromUrl(url, name, mime) {
        let res = await emit(`GET ${url} STREAM`);
        let size = res.headers['content-length'];
        return new File(res, size, name, mime);
    }
    static async fromFilePath(path, name, mime) {
        if (!await isFile(path))
            throw new Error('This is not a file! ' + path);
        let size = (await stat(path)).size;
        return new File(getReadStream(path), size, name, mime);
    }
}

// Some services looks at extensions, so extension can be changed runtime in adapter
export class Image extends BaseFile {
    constructor(stream, size) {
        super(stream, size, 'image.jpg');
    }
    static async fromUrl(url) {
        let res = await emit(`GET ${url}`);
        let size = parseInt(res.headers['content-length'], 10);
        return new Image(createReadStream(res.raw), size);
    }
    static async fromFilePath(path) {
        let size = (await stat(path)).size;
        return new Image(getReadStream(path), size);
    }
    static async fromCanvas(canvas) {
        let fullStream = canvas.jpegStream({
            bufsize: 4096,
            quality: 100,
            progressive: true
        });
        let buffer = await readStream(fullStream);
        return new Image(createReadStream(buffer), buffer.length);
    }
}
export class Audio extends BaseFile {
    constructor(stream, size, artist, title) {
        super(stream, size, `${artist} ${title}.mp3`);
    }
    static async fromUrl(url, artist, title) {
        let res = await emit(`GET ${url} STREAM`);
        let size = res.headers['content-length'];
        return new Audio(res, size, artist, title);
    }
    static async fromFilePath(path, artist, title) {
        let size = (await stat(path)).size;
        return new Audio(getReadStream(path), size, artist, title);
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
    xbot: XBot;

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

interface IMessageEventConstructionData {
    api: Api,
    attachment: File|Audio|Image;
    text: string;
    user: User,
    chat?: Chat,
    messageId: any,
    replyTo?: ForwardedMessage
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
    isUser: boolean=true;
    constructor(data:IMessageEventConstructionData) {
        //assertAllIsDefined(api,mid,attachment,text,user,chat);
        super(data.api, data.chat ? data.chat.targetId : data.user.targetId, data.messageId);
        this.attachment = data.attachment;
        this.text = data.text;
        this.user = data.user;
        this.chat = data.chat;
        this.replyTo = data.replyTo;
    }
    attachXBot(xbot){
        this.xbot=xbot;
        if(this.chat)
            this.chat.xbot=xbot;
        this.user.xbot=xbot;
    }
}
interface IJoinEventConstructionData {
    user: User;
    chat: Chat;
    initiator?: User
}
export class JoinEvent {
    sourceApi: Api;
    user: User;
    chat: Chat;
    initiator?: User;
    xbot: XBot;

    constructor(data: IJoinEventConstructionData) {
        //assertAllIsDefined(user,chat);
        this.user = data.user;
        this.chat = data.chat;
        this.initiator = data.initiator;
    }
    attachXBot(xbot){
        this.xbot=xbot;
        this.chat.xbot=xbot;
        this.user.xbot=xbot;
        if(this.initiator)
            this.initiator.xbot=xbot;
    }
}
interface IActionEventConstructionData{
    user: User;
    action: string;
    chat?: Chat;
    data?: any
}
export class ActionEvent {
    sourceApi: Api;
    user: User;
    chat: Chat;
    action: string;
    data: any;
    xbot: XBot;

    constructor(data:IActionEventConstructionData) {
        //assertAllIsDefined(user);
        this.action = data.action;
        this.user = data.user;
        this.chat = data.chat;
        this.data = data.data;
    }
    attachXBot(xbot){
        this.xbot=xbot;
        if(this.chat)
            this.chat.xbot=xbot;
        this.user.xbot=xbot;
    }
}
interface ILeaveEventConstructionData {
    user:User;
    chat:Chat;
    initiator?:User;
}
export class LeaveEvent {
    sourceApi: Api;
    user: User;
    chat: Chat;
    initiator: User;
    xbot: XBot;

    constructor(data: ILeaveEventConstructionData) {
        this.user = data.user;
        this.chat = data.chat;
        this.initiator = data.initiator;
    }
    attachXBot(xbot){
        this.xbot=xbot;
        this.chat.xbot=xbot;
        this.user.xbot=xbot;
    }
}
interface ITitleChangeEventConstructionData{
    oldTitle: string;
    newTitle: string;
    initiator: User;
    chat: Chat;
}
export class TitleChangeEvent {
    sourceApi: Api;
    newTitle: string;
    oldTitle: string;
    initiator: User;
    chat: Chat;

    xbot: XBot;

    constructor(data: ITitleChangeEventConstructionData) {
        this.oldTitle = data.oldTitle;
        this.newTitle = data.newTitle;
        this.initiator = data.initiator;
        this.chat = data.chat;
    }
    attachXBot(xbot){
        this.xbot=xbot;
        this.chat.xbot=xbot;
        this.initiator.xbot=xbot;
    }
}
interface IPhotoChangeEventConstructionData{
    newPhotoUrl:string;
    initiator:User;
    chat:Chat;
}
export class PhotoChangeEvent {
    sourceApi: Api;
    newPhotoUrl: string;
    initiator: User;
    chat: Chat;
    xbot: XBot;

    constructor(data:IPhotoChangeEventConstructionData) {
        //assertAllIsDefined(newPhotoUrl,initiator,chat);
        this.newPhotoUrl = data.newPhotoUrl;
        this.initiator = data.initiator;
        this.chat = data.chat;
    }
    attachXBot(xbot){
        this.xbot=xbot;
        this.chat.xbot=xbot;
        this.initiator.xbot=xbot;
    }
}