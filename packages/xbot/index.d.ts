/// <reference types="node" />
import Logger from '@meteor-it/logger';
import EventEmitter from './EventEmitter';
import { Readable } from 'stream';
import TimingData from './TimingData';
export default class XBot extends EventEmitter {
    logger: Logger;
    name: string;
    apiList: Api[];
    constructor(name: string);
    attachApi(api: Api): void;
    onMessage(message: MessageEvent, sourceApi: Api): void;
    onLeave(leave: LeaveEvent, sourceApi: Api): void;
    onJoin(join: JoinEvent, sourceApi: Api): void;
    onAction(action: ActionEvent, sourceApi: Api): void;
    onPhoto(photo: PhotoChangeEvent, sourceApi: Api): void;
    onTitle(title: TitleChangeEvent, sourceApi: Api): void;
    uGetUser(uid: string): Promise<User>;
    uGetChat(cid: string): Promise<Chat>;
}
export declare type IMessageOptions = {};
export declare class Api extends EventEmitter {
    logger: Logger;
    logged: boolean;
    constructor(name: string | Logger);
    auth(...params: string[]): Promise<void>;
    uGetUser(uid: string): Promise<User>;
    uGetChat(cid: string): Promise<Chat>;
    sendLocation(conv: Conversation, answer: boolean, caption: string, location: Location, options: IMessageOptions): Promise<void>;
    sendText(conv: Conversation, answer: boolean, text: string, options: IMessageOptions): Promise<void>;
    sendImageStream(conv: Conversation, answer: boolean, caption: string, image: Image, options: IMessageOptions): Promise<void>;
    sendFileStream(conv: Conversation, answer: boolean, caption: string, file: File, options: IMessageOptions): Promise<void>;
    sendAudioStream(conv: Conversation, answer: boolean, caption: string, audio: Audio, options: IMessageOptions): Promise<void>;
    sendCustom(conv: Conversation, answer: boolean, caption: string, options: IMessageOptions): Promise<void>;
}
export declare class Location {
    lat: number;
    long: number;
    constructor(lat: number, long: number);
}
export declare class Attachment {
    type: string;
    constructor(type: string);
}
export declare class MessengerSpecific<T> extends Attachment {
    messengerSpecificType: string;
    data: T;
    constructor(messengerSpecificType: string, data: T);
}
export declare class BaseFile extends Attachment {
    stream: Readable;
    size: number;
    name: string;
    constructor(stream: Readable, size: number, name: string);
}
export declare class File extends BaseFile {
    mime: string;
    constructor(stream: Readable, size: number, name: string, mime?: string);
    static fromBuffer(buffer: Buffer, name: string, mime?: string): Promise<File>;
    static fromUrl(url: string, name: string, mime?: string): Promise<File>;
    static fromFilePath(path: string, name: string, mime?: string): Promise<File>;
}
export declare class Image extends BaseFile {
    constructor(stream: Readable, size: number);
    static fromUrl(url: string): Promise<Image>;
    static fromFilePath(path: string): Promise<Image>;
    static fromCanvas(canvas: any): Promise<Image>;
}
export declare class Audio extends BaseFile {
    constructor(stream: Readable, size: number, artist: string, title: string);
    static fromUrl(url: string, artist: string, title: string): Promise<Audio>;
    static fromFilePath(path: string, artist: string, title: string): Promise<Audio>;
}
export declare enum Gender {
    MAN = 1,
    WOMAN = 2,
    OTHER = 3,
}
export declare class ForwardedMessage {
    text: string;
    sender: User;
    attachment: Audio | Image | File;
    constructor({text, sender, attachment}: {
        text: string;
        sender: User;
        attachment?: Audio | Image | File;
    });
}
export declare class Conversation {
    api: Api;
    targetId: string;
    messageId: string;
    xbot: XBot;
    isUser: boolean;
    isChat: boolean;
    constructor(api: Api, targetId: string, messageId: string);
    sendLocation(answer: boolean, caption: string, location: Location, options?: IMessageOptions): Promise<void>;
    sendText(answer: boolean, text: string, options?: IMessageOptions): Promise<void>;
    sendImage(answer: boolean, caption: string, image: Image, options?: IMessageOptions): Promise<void>;
    sendFile(answer: boolean, caption: string, file: File, options?: IMessageOptions): Promise<void>;
    sendAudio(answer: boolean, caption: string, audio: Audio, options?: IMessageOptions): Promise<void>;
    sendCustom(answer: boolean, caption: string, messengerSpecific: MessengerSpecific<any>, options?: IMessageOptions): Promise<void>;
}
export declare class User extends Conversation {
    uid: string;
    nickName: string;
    firstName: string;
    lastName: string;
    gender: Gender;
    photoUrl: string;
    config: any;
    state: any;
    profileUrl: string;
    isUser: boolean;
    isChat: boolean;
    xbot: XBot;
    constructor({api, uid, targetId, nickName, firstName, lastName, gender, photoUrl, profileUrl, messageId}: {
        api: Api;
        uid: string;
        targetId: string;
        nickName: string;
        firstName: string;
        lastName: string;
        gender: Gender;
        photoUrl: string;
        profileUrl: string;
        messageId: string;
    });
    getPhotoImage(): Promise<Image>;
    getName(): string;
    getFullName(): string;
}
export declare class Chat extends Conversation {
    cid: string;
    users: User[];
    title: string;
    admins: User[];
    photoUrl: string;
    isUser: boolean;
    isChat: boolean;
    xbot: XBot;
    constructor({api, cid, targetId, title, users, admins, messageId, photoUrl}: {
        api: Api;
        cid: string;
        targetId: string;
        title: string;
        users: User[];
        admins: User[];
        messageId: string;
        photoUrl: string;
    });
    isAdmin(user: User): boolean;
    getPhotoImage(): Promise<Image>;
}
export interface IMessageEventConstructionData {
    api: Api;
    attachment: File | Audio | Image;
    text: string;
    user: User;
    chat?: Chat;
    messageId: any;
    replyTo?: ForwardedMessage;
    timing?: TimingData;
}
export declare class MessageEvent extends Conversation {
    attachment: File | Audio | Image;
    text: string;
    user: User;
    chat: Chat;
    replyTo: ForwardedMessage;
    xbot: XBot;
    timing: TimingData;
    readonly isChat: boolean;
    isUser: boolean;
    constructor(data: IMessageEventConstructionData);
    attachXBot(xbot: XBot): void;
}
export interface IJoinEventConstructionData {
    user: User;
    chat: Chat;
    initiator?: User;
    timing?: TimingData;
}
export declare class JoinEvent {
    sourceApi: Api;
    user: User;
    chat: Chat;
    initiator?: User;
    xbot: XBot;
    timing: TimingData;
    constructor(data: IJoinEventConstructionData);
    attachXBot(xbot: XBot): void;
}
export interface IActionEventConstructionData {
    user: User;
    action: string;
    chat?: Chat;
    data?: any;
    timing?: TimingData;
}
export declare class ActionEvent {
    sourceApi: Api;
    user: User;
    chat: Chat;
    action: string;
    data: any;
    xbot: XBot;
    timing: TimingData;
    constructor(data: IActionEventConstructionData);
    attachXBot(xbot: XBot): void;
}
export interface ILeaveEventConstructionData {
    user: User;
    chat: Chat;
    initiator?: User;
    timing?: TimingData;
}
export declare class LeaveEvent {
    sourceApi: Api;
    user: User;
    chat: Chat;
    initiator: User;
    xbot: XBot;
    timing: TimingData;
    constructor(data: ILeaveEventConstructionData);
    attachXBot(xbot: XBot): void;
}
export interface ITitleChangeEventConstructionData {
    oldTitle: string;
    newTitle: string;
    initiator: User;
    chat: Chat;
    timing?: TimingData;
}
export declare class TitleChangeEvent {
    sourceApi: Api;
    newTitle: string;
    oldTitle: string;
    initiator: User;
    chat: Chat;
    xbot: XBot;
    timing: TimingData;
    constructor(data: ITitleChangeEventConstructionData);
    attachXBot(xbot: XBot): void;
}
export interface IPhotoChangeEventConstructionData {
    newPhotoUrl: string;
    initiator: User;
    chat: Chat;
    timing?: TimingData;
}
export declare class PhotoChangeEvent {
    sourceApi: Api;
    newPhotoUrl: string;
    initiator: User;
    chat: Chat;
    xbot: XBot;
    timing: TimingData;
    constructor(data: IPhotoChangeEventConstructionData);
    attachXBot(xbot: XBot): void;
}
