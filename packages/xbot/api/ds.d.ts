import { Api, User, Chat } from "../";
import { Client } from 'discord.js';
export default class DSApi extends Api {
    logged: boolean;
    client: Client;
    constructor();
    auth(token: any): Promise<void>;
    parseAttachment(type: any, obj: any): Promise<void>;
    startReceiver(): Promise<void>;
    uGetUser(uid: string): Promise<User>;
    uGetChat(cid: string): Promise<Chat>;
    photoCache: Map<any, any>;
    getUserFromApiData(data: any): User;
    getChatFromApiData(data: any, guild: any): Chat;
    sendLocation(targetId: any, answer: any, caption: any, location: any, options: any): Promise<void>;
    limitTextString(text: any): IterableIterator<string>;
    sendText(targetId: any, answer: any, text: any, options: any): Promise<void>;
    sendImageStream(targetId: any, answer: any, caption: any, image: any, options: any): Promise<void>;
    sendFileStream(targetId: any, answer: any, caption: any, file: any, options: any): Promise<void>;
    sendAudioStream(targetId: any, answer: any, caption: any, audio: any, options: any): Promise<void>;
    sendCustom(targetId: any, answer: any, options: any): Promise<void>;
}
