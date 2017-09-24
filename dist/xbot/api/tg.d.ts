import { Api, User, Chat } from "../";
import TelegramBot from 'node-telegram-bot-api';
export default class TGApi extends Api {
    logged: boolean;
    bot: TelegramBot;
    constructor();
    auth(token: any): Promise<void>;
    parseAttachment(type: any, obj: any): Promise<any>;
    startReceiver(): Promise<void>;
    uGetUser(uid: string): Promise<User>;
    uGetChat(cid: string): Promise<Chat>;
    photoCache: Map<any, any>;
    getUserFromApiData(data: any): Promise<User>;
    getChatFromApiData(data: any): Promise<Chat>;
    sendLocation(targetId: any, answer: any, caption: any, location: any, options: any): Promise<void>;
    sendText(targetId: any, answer: any, text: any, options: any): Promise<void>;
    sendImageStream(targetId: any, answer: any, caption: any, image: any, options: any): Promise<void>;
    sendFileStream(targetId: any, answer: any, caption: any, file: any, options: any): Promise<void>;
    sendAudioStream(targetId: any, answer: any, caption: any, audio: any, options: any): Promise<void>;
    sendCustom(targetId: any, answer: any, options: any): Promise<void>;
}
