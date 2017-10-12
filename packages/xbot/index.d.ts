/// <reference types="node" />
import Logger from '@meteor-it/logger';
import EventEmitter from './EventEmitter';
import { Readable } from 'stream';
import TimingData from './TimingData.js';
export default class XBot extends EventEmitter {
    logger: Logger;
    name: string;
    apiList: any[];
    constructor(name: string);
    attachApi(api: Api): void;
    onMessage(message: MessageEvent, sourceApi: Api): void;
    onLeave(leave: LeaveEvent, sourceApi: Api): void;
    onJoin(join: JoinEvent, sourceApi: Api): void;
    onAction(action: ActionEvent, sourceApi: Api): void;
    onPhoto(photo: PhotoChangeEvent, sourceApi: Api): void;
    onTitle(title: TitleChangeEvent, sourceApi: Api): void;
    uGetUser(uid: any): Promise<any>;
    uGetChat(cid: any): Promise<any>;
    onWaitNext(...args: any[]): void;
}
export declare class Api extends EventEmitter {
    name: string;
    logger: Logger;
    logged: boolean;
    constructor(name: string);
    auth(...params: any[]): Promise<void>;
    uGetUser(uid: string): Promise<User>;
    uGetChat(cid: string): Promise<Chat>;
    sendLocation(targetId: any, answer: any, caption: string, location: Location, options: any): Promise<void>;
    sendText(targetId: any, answer: any, text: string, options: any): Promise<void>;
    sendImageStream(targetId: any, answer: any, caption: string, image: Image, options: any): Promise<void>;
    sendFileStream(targetId: any, answer: any, caption: string, file: File, options: any): Promise<void>;
    sendAudioStream(targetId: any, answer: any, caption: string, audio: Audio, options: any): Promise<void>;
    sendCustom(targetId: any, answer: any, caption: string, options: any): Promise<void>;
}
export declare class Location {
    lat: number;
    long: number;
    constructor(lat: any, long: any);
}
export interface Attachment {
    type: string;
}
export declare class MessengerSpecific implements Attachment {
    type: string;
    data: any;
    constructor(type: string, data: any);
}
export declare class BaseFile implements Attachment {
    type: string;
    stream: Readable;
    size: number;
    name: string;
    constructor(stream: any, size: any, name: any);
}
export declare class File extends BaseFile {
    mime: any;
    constructor(stream: any, size: any, name: any, mime?: string);
    static fromBuffer(buffer: any, name: any, mime?: any): Promise<File>;
    static fromUrl(url: any, name: any, mime?: any): Promise<File>;
    static fromFilePath(path: any, name: any, mime?: any): Promise<File>;
}
export declare class Image extends BaseFile {
    constructor(stream: any, size: any);
    static fromUrl(url: any): Promise<Image>;
    static fromFilePath(path: any): Promise<Image>;
    static fromCanvas(canvas: any): Promise<Image>;
}
export declare class Audio extends BaseFile {
    constructor(stream: any, size: any, artist: any, title: any);
    static fromUrl(url: any, artist: any, title: any): Promise<Audio>;
    static fromFilePath(path: any, artist: any, title: any): Promise<Audio>;
}
export declare enum Role {
    CREATOR = 1,
    MODERATOR = 2,
    USER = 3,
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
        text: any;
        sender: any;
        attachment: any;
    });
}
export declare class Conversation {
    sourceApi: Api;
    api: any;
    targetId: any;
    messageId: any;
    xbot: XBot;
    constructor(api: any, targetId: any, messageId: any);
    sendLocation(answer: any, caption: any, location: any, options?: {}): Promise<any>;
    sendText(answer: any, text: any, options?: {}): Promise<any>;
    sendImage(answer: any, caption: any, image: any, options?: {}): Promise<any>;
    sendFile(answer: any, caption: any, file: any, options?: {}): Promise<any>;
    sendAudio(answer: any, caption: any, audio: any, options?: {}): Promise<any>;
    sendVoice(answer: any, caption: any, file: any, options?: {}): Promise<any>;
    sendCustom(answer: any, caption: any, options?: {}): Promise<any>;
}
export declare class User extends Conversation {
    uid: string;
    nickName: string;
    firstName: string;
    lastName: string;
    gender: Gender;
    photoUrl: string;
    role: Role;
    config: any;
    state: any;
    profileUrl: string;
    isUser: boolean;
    isChat: boolean;
    xbot: XBot;
    constructor({api, uid, targetId, nickName, firstName, lastName, gender, photoUrl, role, profileUrl, messageId}: {
        api: any;
        uid: any;
        targetId: any;
        nickName?: null;
        firstName: any;
        lastName: any;
        gender: any;
        photoUrl: any;
        role?: Role;
        profileUrl: any;
        messageId: any;
    });
    getPhotoImage(): Promise<Image>;
    getName(): string;
    getFullName(): string;
    waitNew(...args: any[]): void;
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
        api: any;
        cid: any;
        targetId: any;
        title: any;
        users: any;
        admins: any;
        messageId: any;
        photoUrl: any;
    });
    isAdmin(user: any): number | boolean;
    getPhotoImage(): Promise<Image>;
    waitNew(...args: any[]): void;
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
    attachXBot(xbot: any): void;
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
    attachXBot(xbot: any): void;
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
    attachXBot(xbot: any): void;
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
    attachXBot(xbot: any): void;
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
    attachXBot(xbot: any): void;
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
    attachXBot(xbot: any): void;
}
