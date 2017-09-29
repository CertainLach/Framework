import Logger from '@meteor-it/logger';
import EventEmitter from './EventEmitter';
import {getReadStream,stat,isFile} from '@meteor-it/fs';
import {emit} from '@meteor-it/xrest';
import {readStream,createReadStream} from '@meteor-it/utils';
import {Readable} from 'stream';
import TimingData from './TimingData.js';

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
        let timing=message.timing;
        timing.stop();
        message.sourceApi = sourceApi;
        timing.start('Xbot extension')
        message.attachXBot(this);
        timing.stop();
        timing.start('Console log');
        let inChat = message.chat ? (` [${message.chat.title.red}]`) : '';
        let attachment = message.attachment ? (`A`.magenta) : ' ';
        let reply = message.replyTo ? (`R`.magenta) : ' ';
        let lastName=message.user.lastName?` ${message.user.lastName.blue}`:'';

        this.logger.log(`<${message.user.firstName.blue}${lastName}${inChat}>[${attachment}${reply}]\n${message.text}`);
        timing.stop();
        timing.start('XBot <=> Ayzek transfer');
        this.emit('message', message);
    }
    onLeave(leave: LeaveEvent, sourceApi: Api) {
        leave.sourceApi = sourceApi;
        leave.attachXBot(this);
        let initiator = leave.initiator ? ` (by ${leave.initiator.firstName.blue} ${leave.initiator.lastName.blue})` : '';
        let lastName=leave.user.lastName?` ${leave.user.lastName.blue}`:'';
        this.logger.log(`${leave.user.firstName.blue}${lastName} {red}leaved{/red} ${leave.chat.title.red}${initiator}`);
        this.emit('leave', leave);
    }
    onJoin(join: JoinEvent, sourceApi: Api) {
        join.sourceApi = sourceApi;
        join.attachXBot(this);
        let initiator = join.initiator ? ` (by ${join.initiator.firstName.blue} ${join.initiator.lastName.blue})` : '';
        let lastName=join.user.lastName?` ${join.user.lastName.blue}`:'';
        this.logger.log(`${join.user.firstName.blue}${lastName} {green}joined{/green} ${join.chat.title.red}${initiator}`);
        this.emit('join', join);
    }
    onAction(action: ActionEvent, sourceApi: Api) {
        action.sourceApi = sourceApi;
        action.attachXBot(this);
        let inChat = action.chat ? (` [${action.chat.title.red}]`) : '';
        let lastName=action.user.lastName?` ${action.user.lastName.blue}`:'';
        this.logger.log(`${action.user.firstName.blue}${lastName}${inChat} - ${action.action.yellow}`);
        this.emit('action', action);
    }
    onPhoto(photo: PhotoChangeEvent, sourceApi: Api) {
        photo.sourceApi = sourceApi;
        photo.attachXBot(this);
        let lastName=photo.initiator.lastName?` ${photo.initiator.lastName.blue}`:'';
        this.logger.log(`Changed photo in ${photo.chat.title.red} -> ${photo.newPhotoUrl} by ${photo.initiator.firstName}${lastName}`);
        this.emit('photo', photo);
    }
    onTitle(title: TitleChangeEvent, sourceApi: Api) {
        title.sourceApi = sourceApi;
        title.attachXBot(this);
        let lastName=title.initiator.lastName?` ${title.initiator.lastName.blue}`:'';
        this.logger.log(title.oldTitle.red + ' -> ' + title.newTitle.green + ' by ' + title.initiator.firstName + lastName);
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
    onWaitNext(...args:any[]){
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

export interface Attachment {
    type: string;
}

export class MessengerSpecific implements Attachment{
    type: string;
    data: any;
    constructor(type:string,data:any){
        this.type=type; 
        this.data=data;  
    }
}

export class BaseFile implements Attachment{
    type = 'file';
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
    constructor(stream, size, name, mime='text/plain') {
        super(stream, size, name);
        this.mime=mime;
    }
    static async fromBuffer(buffer, name, mime?) {
        return new File(createReadStream(buffer), buffer.length, name, mime);
    }
    static async fromUrl(url, name, mime?) {
        let res = await emit(`GET ${url} STREAM`);
        let size = +res.headers['content-length'];
        return new File(res, size, name, mime);
    }
    static async fromFilePath(path, name, mime?) {
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

export enum Role {
    CREATOR = 1,
    MODERATOR = 2,
    USER = 3
}
export enum Gender {
    MAN = 1,
    WOMAN = 2,
    OTHER = 3
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

export class Conversation {
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
            this.xbot.logger.log(`<${'Ayzek'.blue} ${'Azimov'.blue}${inChat}>[${attachment}${reply}]${(`\n${caption}`||'')}`);
        }
        return await this.api.sendLocation(this.targetId, answer, caption, location, options);
    }
    async sendText(answer, text, options = {}) {
        if(this.xbot){
            let inChat = (this instanceof Chat) ? (` [${this.title.red}]`) : '';
            let attachment = false ? (`A`.magenta) : ' ';
            let reply = answer ? (`R`.magenta) : ' ';
            this.xbot.logger.log(`<${'Ayzek'.blue} ${'Azimov'.blue}${inChat}>[${attachment}${reply}]\n${text.green}`);
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
            this.xbot.logger.log(`<${'Ayzek'.blue} ${'Azimov'.blue}${inChat}>[${attachment}${reply}]${(`\n${caption}`||'')}`);
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
            this.xbot.logger.log(`<${'Ayzek'.blue} ${'Azimov'.blue}${inChat}>[${attachment}${reply}]${(`\n${caption}`||'')}`);
        }
        return await this.api.sendFileStream(this.targetId, answer ? this.messageId : undefined, caption, file, options);
    }
    async sendAudio(answer, caption, audio, options = {}) {
        if (!(audio instanceof Audio))
            throw new Error('"audio" is not a instance of Audio!');
        if(this.xbot){
            let inChat = (this instanceof Chat) ? (` [${this.title.red}]`) : '';
            let attachment = true ? (`A`.magenta) : ' ';
            let reply = answer ? (`R`.magenta) : ' ';
            this.xbot.logger.log(`<${'Ayzek'.blue} ${'Azimov'.blue}${inChat}>[${attachment}${reply}]${(`\n${caption}`||'')}`);
        }
        return await this.api.sendAudioStream(this.targetId, answer ? this.messageId : undefined, caption, audio, options);
    }
    async sendVoice(answer, caption, file, options = {}){
        if (!(file instanceof File))
            throw new Error('"file" is not a instance of File!');
        if(this.xbot){
            let inChat = (this instanceof Chat) ? (` [${this.title.red}]`) : '';
            let attachment = true ? (`A`.magenta) : ' ';
            let reply = answer ? (`R`.magenta) : ' ';
            this.xbot.logger.log(`<${'Ayzek'.blue} ${'Azimov'.blue}${inChat}>[${attachment}${(`\n${reply}`||'')}]`);
        }
        return await this.api.sendVoiceStream(this.targetId, answer ? this.messageId : undefined, caption, file, options);
    }
    async sendCustom(answer, caption, options = {}) {
        return await this.api.sendCustom(this.targetId, answer ? this.messageId : undefined, caption, options);
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
    isUser:boolean=true;
    isChat:boolean=false;
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
    isUser:boolean=false;
    isChat:boolean=true;
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

export interface IMessageEventConstructionData {
    api: Api;
    attachment: File|Audio|Image;
    text: string;
    user: User;
    chat?: Chat;
    messageId: any;
    replyTo?: ForwardedMessage;
    timing?: TimingData;
}
export class MessageEvent extends Conversation {
    attachment: File|Audio|Image;
    text: string;
    user: User;
    chat: Chat;
    replyTo: ForwardedMessage;
    xbot: XBot;
    timing: TimingData;

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
        this.timing = data.timing||new TimingData();
        this.replyTo = data.replyTo;
    }
    attachXBot(xbot){
        this.xbot=xbot;
        if(this.chat)
            this.chat.xbot=xbot;
        this.user.xbot=xbot;
    }
}
export interface IJoinEventConstructionData {
    user: User;
    chat: Chat;
    initiator?: User;
    timing?: TimingData
}
export class JoinEvent {
    sourceApi: Api;
    user: User;
    chat: Chat;
    initiator?: User;
    xbot: XBot;
    timing: TimingData;

    constructor(data: IJoinEventConstructionData) {
        //assertAllIsDefined(user,chat);
        this.user = data.user;
        this.chat = data.chat;
        this.initiator = data.initiator;
        this.timing=data.timing||new TimingData();
    }
    attachXBot(xbot){
        this.xbot=xbot;
        this.chat.xbot=xbot;
        this.user.xbot=xbot;
        if(this.initiator)
            this.initiator.xbot=xbot;
    }
}
export interface IActionEventConstructionData{
    user: User;
    action: string;
    chat?: Chat;
    data?: any;
    timing?: TimingData;
}
export class ActionEvent {
    sourceApi: Api;
    user: User;
    chat: Chat;
    action: string;
    data: any;
    xbot: XBot;
    timing: TimingData;

    constructor(data:IActionEventConstructionData) {
        //assertAllIsDefined(user);
        this.action = data.action;
        this.user = data.user;
        this.chat = data.chat;
        this.data = data.data;
        this.timing=data.timing||new TimingData();
    }
    attachXBot(xbot){
        this.xbot=xbot;
        if(this.chat)
            this.chat.xbot=xbot;
        this.user.xbot=xbot;
    }
}
export interface ILeaveEventConstructionData {
    user:User;
    chat:Chat;
    initiator?:User;
    timing?: TimingData;
}
export class LeaveEvent {
    sourceApi: Api;
    user: User;
    chat: Chat;
    initiator: User;
    xbot: XBot;
    timing: TimingData;

    constructor(data: ILeaveEventConstructionData) {
        this.user = data.user;
        this.chat = data.chat;
        this.initiator = data.initiator;
        this.timing=data.timing||new TimingData();
    }
    attachXBot(xbot){
        this.xbot=xbot;
        this.chat.xbot=xbot;
        this.user.xbot=xbot;
    }
}
export interface ITitleChangeEventConstructionData{
    oldTitle: string;
    newTitle: string;
    initiator: User;
    chat: Chat;
    timing?: TimingData;
}
export class TitleChangeEvent {
    sourceApi: Api;
    newTitle: string;
    oldTitle: string;
    initiator: User;
    chat: Chat;
    xbot: XBot;
    timing: TimingData;

    constructor(data: ITitleChangeEventConstructionData) {
        this.oldTitle = data.oldTitle;
        this.newTitle = data.newTitle;
        this.initiator = data.initiator;
        this.chat = data.chat;
        this.timing=data.timing||new TimingData();
    }
    attachXBot(xbot){
        this.xbot=xbot;
        this.chat.xbot=xbot;
        this.initiator.xbot=xbot;
    }
}
export interface IPhotoChangeEventConstructionData{
    newPhotoUrl:string;
    initiator:User;
    chat:Chat;
    timing?: TimingData;
}
export class PhotoChangeEvent {
    sourceApi: Api;
    newPhotoUrl: string;
    initiator: User;
    chat: Chat;
    xbot: XBot;
    timing: TimingData;

    constructor(data:IPhotoChangeEventConstructionData) {
        //assertAllIsDefined(newPhotoUrl,initiator,chat);
        this.newPhotoUrl = data.newPhotoUrl;
        this.initiator = data.initiator;
        this.chat = data.chat;
        this.timing=data.timing||new TimingData();
    }
    attachXBot(xbot){
        this.xbot=xbot;
        this.chat.xbot=xbot;
        this.initiator.xbot=xbot;
    }
}