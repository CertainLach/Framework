import Logger from '@meteor-it/logger';
import EventEmitter from './EventEmitter';
import {getReadStream,stat,isFile} from '@meteor-it/fs';
import {emit} from '@meteor-it/xrest';
import {readStreamToBuffer,createReadStream} from '@meteor-it/utils';
import {Readable} from 'stream';
import TimingData from './TimingData';
import {lookupByPath} from '@meteor-it/mime';

// TODO: More discord related types
// TODO: Split logging to middlewares

// const UNDEFINED='{green}<undefined>{/green}';

// function logMessage(logger,chat,attachment,replyTo,lastName,firstName,nickName,text){
//     const inChat = chat ? (` [${chat.title.red}]`) : '';
//     const inAttachment = attachment ? (`A`.magenta) : ' ';
//     const inReply = replyTo ? (`R`.magenta) : ' ';
//     const inLastName=lastName?` ${lastName.blue}`:'';
//     const inFirstName=firstName?firstName.blue:nickName?nickName.blue:UNDEFINED;
//     const inText=text?'\n'+text:'';
//
//     logger.log(`<${inFirstName}${inLastName}${inChat}>[${inAttachment}${inReply}]${inText}`);
// }


// const POSSIBLE_ACTIONS = ['writing'];
export default class XBot extends EventEmitter {
    logger: Logger;
    name: string;
    apiList:Api[]=[];
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
        message.api = sourceApi;
        message.attachXBot(this);
        // logMessage(this.logger,message.chat,message.attachment,message.replyTo,message.user.lastName,message.user.firstName,message.user.nickName,message.text);
        this.emit('message', message);
    }
    onLeave(leave: LeaveEvent, sourceApi: Api) {
        leave.sourceApi = sourceApi;
        leave.attachXBot(this);
        // let initiator = leave.initiator ? ` (by {blue}${leave.initiator.firstName} ${leave.initiator.lastName}{/blue})` : '';
        // let lastName=leave.user.lastName?` {blue}${leave.user.lastName}{/blue}`:'';
        // this.logger.log(`{blue}${join.user.firstName}{/blue}${lastName} {red}leaved{/red} {red}${leave.chat.title}{/red}${initiator}`);
        this.emit('leave', leave);
    }
    onJoin(join: JoinEvent, sourceApi: Api) {
        join.sourceApi = sourceApi;
        join.attachXBot(this);
        // let initiator = join.initiator ? ` (by {blue}${join.initiator.firstName} ${join.initiator.lastName}{/blue})` : '';
        // let lastName=join.user.lastName?` {blue}${join.user.lastName}{/blue}`:'';
        // this.logger.log(`{blue}${join.user.firstName}{/blue}${lastName} {green}joined{/green} {red}${join.chat.title}{/red}${initiator}`);
        this.emit('join', join);
    }
    onAction(action: ActionEvent, sourceApi: Api) {
        action.sourceApi = sourceApi;
        action.attachXBot(this);
        // let inChat = action.chat ? (` [{red}${action.chat.title}{/red}]`) : '';
        // let lastName=action.user.lastName?` {blue}${action.user.lastName}{/blue}`:'';
        // this.logger.log(`{blue}${action.user.firstName}{/blue}${lastName}${inChat} - {yellow}${action.action}{/yellow}`);
        this.emit('action', action);
    }
    onPhoto(photo: PhotoChangeEvent, sourceApi: Api) {
        photo.sourceApi = sourceApi;
        photo.attachXBot(this);
        // let lastName=photo.initiator.lastName?` {blue}${photo.initiator.lastName}{/blue}`:'';
        // this.logger.log(`Changed photo in {red}${photo.chat.title}{/red} -> ${photo.newPhotoUrl} by ${photo.initiator.firstName}${lastName}`);
        this.emit('photo', photo);
    }
    onTitle(title: TitleChangeEvent, sourceApi: Api) {
        title.sourceApi = sourceApi;
        title.attachXBot(this);
        // const inChat = title.chat ? (` [{red}${title.chat.title}{/red}]`) : '';
        // const inOldTitle=title.oldTitle?title.oldTitle.red:UNDEFINED;
        // const inNewTitle=title.newTitle?title.newTitle.green:UNDEFINED;
        // const inLastName=title.initiator.lastName?` ${title.initiator.lastName.blue}`:'';
        // const inFirstName=firstName?firstName.blue:title.initiator.nickName?title.initiator.nickName.blue:UNDEFINED;
        // this.logger.log(`${inOldTitle} -> ${inNewTitle} by ${inFirstName} ${inLastName}${inChat}`);
        this.emit('title', title);
    }
    async uGetUser(uid:string){
        let found=null;
        for(let i=0;i<this.apiList.length;i++){
            try{
                found=await this.apiList[i].uGetUser(uid);
                if(found)
                    break;
            }catch(e){}
        }
        if(found!==null)
            found.xbot=this;
        return found;
    }
    async uGetChat(cid:string){
        let found=null;
        for(let i=0;i<this.apiList.length;i++){
            try{
                found=await this.apiList[i].uGetChat(cid);
                if(found)
                    break;
            }catch(e){}
        }
        if(found!==null)
            found.xbot=this;
        return found;
    }
    // onWaitNext(...args:any[]){
    //     this.logger.warn(`onWaitNext should be implemented in extender class!`);
    // }
}

class NotImplementedInApiError extends Error{
    constructor(method:string){
        super(`Not implemented in api: ${method}()`);
    }
}

export type IMessageOptions = {

}

export class Api extends EventEmitter {
    logger: Logger;
    logged:boolean = false;

    constructor(name: string|Logger) {
        super();
        if(name instanceof Logger)
            this.logger=name;
        else
            this.logger = new Logger(name);
    }
    auth(...params:string[]): Promise<void>{
        throw new NotImplementedInApiError('auth');
    }
    uGetUser(uid:string): Promise<User>{
        throw new NotImplementedInApiError('uGetUser');
    }
    uGetChat(cid:string): Promise<Chat>{
        throw new NotImplementedInApiError('uGetChat');
    }
    sendLocation(conv:Conversation, answer: boolean, caption: string,location: Location,options:IMessageOptions): Promise<void>{
        throw new NotImplementedInApiError('sendLocation');
    }
    sendText(conv:Conversation, answer: boolean, text: string, options:IMessageOptions): Promise<void>{
        throw new NotImplementedInApiError('sendText');
    }
    sendImageStream(conv:Conversation, answer: boolean, caption:string, image:Image, options:IMessageOptions): Promise<void>{
        throw new NotImplementedInApiError('sendImageStream');
    }
    sendFileStream(conv:Conversation, answer: boolean, caption:string, file:File, options:IMessageOptions): Promise<void>{
        throw new NotImplementedInApiError('sendFileStream');
    }
    sendAudioStream(conv:Conversation, answer: boolean, caption:string, audio:Audio, options:IMessageOptions): Promise<void>{
        throw new NotImplementedInApiError('sendAudioStream');
    }
    sendCustom(conv:Conversation, answer: boolean, caption:string, options: IMessageOptions): Promise<void>{
        throw new NotImplementedInApiError('sendCustom');
    }
}

export class Location {
    lat: number;
    long: number;

    constructor(lat:number, long:number) {
        this.lat = lat;
        this.long = long;
    }
}

export class Attachment {
    type: string;
    constructor(type:string){
        this.type = type;
    }
}

export class MessengerSpecific<T> extends Attachment{
    messengerSpecificType: string;
    data: T;
    constructor(messengerSpecificType:string,data:T){
        super('messengerSpecific');
        this.messengerSpecificType=messengerSpecificType;
        this.data=data;
    }
}

export class BaseFile extends Attachment{
    stream: Readable;
    size: number;
    name: string;
    constructor(stream:Readable, size:number, name:string){
        super('file');
        this.stream = stream;
        this.size = size;
        this.name = name;
    }
}

export class File extends BaseFile {
    mime:string;
    constructor(stream:Readable, size:number, name:string, mime='text/plain') {
        super(stream, size, name);
        this.mime=mime;
    }
    static async fromBuffer(buffer:Buffer, name:string, mime:string='text/plain') {
        return new File(createReadStream(buffer), buffer.length, name, mime);
    }
    static async fromUrl(url:string, name:string, mime:string = null) {
        let res = await emit(`GET ${url} STREAM`);
        let size = +res.headers['content-length'];
        if(mime===null)
            mime=res.headers['content-type']||'text/plain';
        return new File(res, size, name, mime);
    }
    static async fromFilePath(path:string, name:string, mime:string = null) {
        if (!await isFile(path))
            throw new Error('This is not a file! ' + path);
        let size = (await stat(path)).size;
        if(mime===null)
            mime=lookupByPath(path);
        return new File(getReadStream(path), size, name, mime);
    }
}

// Some services looks at extensions, so extension can be changed runtime in adapter
export class Image extends BaseFile {
    constructor(stream:Readable, size:number) {
        super(stream, size, 'image.jpg');
    }
    static async fromUrl(url:string) {
        let res = await emit(`GET ${url}`);
        let size = parseInt(res.headers['content-length'], 10);
        return new Image(createReadStream(res.raw), size);
    }
    static async fromFilePath(path:string) {
        let size = (await stat(path)).size;
        return new Image(getReadStream(path), size);
    }
    static async fromCanvas(canvas:any) {
        let fullStream = canvas.jpegStream({
            bufsize: 4096,
            quality: 100,
            progressive: true
        });
        let buffer = await readStreamToBuffer(fullStream);
        return new Image(createReadStream(buffer), buffer.length);
    }
}
export class Audio extends BaseFile {
    constructor(stream:Readable, size:number, artist:string, title:string) {
        super(stream, size, `${artist} ${title}.mp3`);
    }
    static async fromUrl(url:string, artist:string, title:string) {
        let res = await emit(`GET ${url} STREAM`);
        let size = res.headers['content-length'];
        return new Audio(res, size, artist, title);
    }
    static async fromFilePath(path:string, artist:string, title:string) {
        let size = (await stat(path)).size;
        return new Audio(getReadStream(path), size, artist, title);
    }
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
    }:{
        text:string;
        sender:User;
        attachment?:Audio|Image|File;
    }) {
        this.text = text;
        this.sender = sender;
        this.attachment = attachment;
    }
}

export class Conversation {
    api:Api;
    targetId:string;
    messageId:string;
    xbot: XBot;
    isUser:boolean;
    isChat:boolean;

    constructor(api:Api, targetId:string, messageId:string) {
        this.api = api;
        this.targetId = targetId;
        this.messageId = messageId;
    }

    async sendLocation(answer:boolean, caption:string, location:Location, options:IMessageOptions={}) {
        // logMessage(this.xbot.logger,(this instanceof Chat)?this:undefined,true,answer, undefined,undefined,this.xbot.logger.name,caption);
        return await this.api.sendLocation(this, answer, caption, location, options);
    }
    async sendText(answer:boolean, text:string, options:IMessageOptions={}) {
        // logMessage(this.xbot.logger,(this instanceof Chat)?this:undefined,undefined,answer, undefined,undefined,this.xbot.logger.name,text);
        return await this.api.sendText(this, answer, text, options);
    }
    async sendImage(answer:boolean, caption:string, image:Image, options:IMessageOptions={}) {
        // logMessage(this.xbot.logger,(this instanceof Chat)?this:undefined,true,answer, undefined,undefined,this.xbot.logger.name,caption);
        return await this.api.sendImageStream(this, answer, caption, image, options);
    }
    async sendFile(answer:boolean, caption:string, file:File, options:IMessageOptions={}) {
        // logMessage(this.xbot.logger,(this instanceof Chat)?this:undefined,true,answer, undefined,undefined,this.xbot.logger.name,caption);
        return await this.api.sendFileStream(this, answer, caption, file, options);
    }
    async sendAudio(answer:boolean, caption:string, audio:Audio, options:IMessageOptions={}) {
        // logMessage(this.xbot.logger,(this instanceof Chat)?this:undefined,true,answer, undefined,undefined,this.xbot.logger.name,caption);
        return await this.api.sendAudioStream(this, answer, caption, audio, options);
    }
    async sendCustom(answer:boolean, caption:string, messengerSpecific:MessengerSpecific<any>, options:IMessageOptions={}) {
        return await this.api.sendCustom(this, answer, caption, options);
    }
}
export class User extends Conversation {
    uid:string;
    nickName:string;
    firstName:string;
    lastName:string;
    gender: Gender;
    photoUrl: string;
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
        profileUrl,
        messageId
    }:{
        api:Api;
        uid:string;
        targetId:string;
        nickName:string;
        firstName:string;
        lastName:string;
        gender:Gender;
        photoUrl:string;
        profileUrl:string;
        messageId:string;
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
    // waitNew(...args){
    //     return this.xbot.onWaitNext(this,...args);
    // }
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
    }:{
        api:Api;
        cid:string;
        targetId:string;
        title:string;
        users:User[];
        admins:User[];
        messageId:string;
        photoUrl:string;
    }) {
        super(api, targetId, messageId);
        this.cid = cid;
        this.users = users;
        this.title = title;
        this.admins = admins;
        this.photoUrl = photoUrl;
    }
    isAdmin(user:User) {
        return this.admins.indexOf(user) !== -1;
    }
    async getPhotoImage():Promise<Image> {
        return await Image.fromUrl(this.photoUrl);
    }
    // waitNew(...args){
    //     return this.xbot.onWaitNext(this,...args);
    // }
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
    xbot: XBot = null;
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
    attachXBot(xbot:XBot){
        this.xbot=xbot;
        if(this.chat&&this.chat.xbot===null)
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
    attachXBot(xbot:XBot){
        this.xbot=xbot;
        if(this.chat.xbot===null)
            this.chat.xbot=xbot;
        if(this.user.xbot===null)
            this.user.xbot=xbot;
        if(this.initiator&&this.initiator.xbot===null)
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
    attachXBot(xbot:XBot){
        this.xbot=xbot;
        if(this.chat&&this.chat.xbot===null)
            this.chat.xbot=xbot;
        if(this.user.xbot===null)
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
    attachXBot(xbot:XBot){
        this.xbot=xbot;
        if(this.chat.xbot===null)
            this.chat.xbot=xbot;
        if(this.user.xbot===null)
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
    attachXBot(xbot:XBot){
        this.xbot=xbot;
        if(this.chat.xbot===null)
            this.chat.xbot=xbot;
        if(this.initiator.xbot===null)
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
    attachXBot(xbot:XBot){
        this.xbot=xbot;
        if(this.chat.xbot===null)
            this.chat.xbot=xbot;
        if(this.initiator.xbot===null)
            this.initiator.xbot=xbot;
    }
}