"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const _1 = require("../");
const utils_1 = require("@meteor-it/utils");
const discord_js_1 = require("discord.js");
const SPACE_REPLACE = String.fromCharCode(8194);
class DSApi extends _1.Api {
    constructor() {
        super('DSAPI');
        this.logged = false;
        this.photoCache = new Map();
    }
    auth(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = new discord_js_1.Client();
            client.login(token);
            this.client = client;
            this.logger.log('Logged in');
            this.logged = true;
            this.startReceiver();
        });
    }
    parseAttachment(type, obj) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    startReceiver() {
        return __awaiter(this, void 0, void 0, function* () {
            this.client.on('message', message => {
                let user = this.getUserFromApiData(message.author);
                let chat = message.channel;
                if (message.guild)
                    chat = this.getChatFromApiData(chat, message.guild);
                let isChat = !!chat;
                let msgEvent = new _1.MessageEvent({
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
        });
    }
    uGetUser(uid) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('WIP');
        });
    }
    uGetChat(cid) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('WIP');
        });
    }
    getUserFromApiData(data) {
        return new _1.User({
            messageId: null,
            api: this,
            uid: 'DS.' + data.id,
            targetId: data,
            nickName: data.username,
            firstName: data.username,
            lastName: '',
            gender: _1.Gender.MAN,
            photoUrl: data.displayAvatarURL,
            profileUrl: 'netu ego, hы'
        });
    }
    getChatFromApiData(data, guild) {
        return new _1.Chat({
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
    sendLocation(targetId, answer, caption, location, options) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    *limitTextString(text) {
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
    sendText(targetId, answer, text, options) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let textPart of this.limitTextString(SPACE_REPLACE + '\n' + text)) {
                yield targetId.send(textPart);
                yield utils_1.sleep(500);
            }
        });
    }
    sendImageStream(targetId, answer, caption, image, options) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    sendFileStream(targetId, answer, caption, file, options) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    sendAudioStream(targetId, answer, caption, audio, options) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    sendCustom(targetId, answer, options) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DSApi;
//# sourceMappingURL=ds.js.map