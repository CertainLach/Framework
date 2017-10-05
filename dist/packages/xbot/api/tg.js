"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const _1 = require("../");
const TelegramBot = require("node-telegram-bot-api");
class TGApi extends _1.Api {
    constructor() {
        super('TGAPI');
        this.logged = false;
        this.photoCache = new Map();
    }
    auth(token) {
        return __awaiter(this, void 0, void 0, function* () {
            const bot = new TelegramBot(token, {
                polling: true
            });
            this.bot = bot;
            this.logger.log('Logged in');
            this.logged = true;
            this.startReceiver();
        });
    }
    parseAttachment(type, obj) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (type) {
                case 'photo':
                    return yield _1.Image.fromUrl(yield this.bot.getFileLink(obj[obj.length - 1].file_id));
                case 'document':
                    return yield _1.File.fromUrl(yield this.bot.getFileLink(obj.file_id), obj.file_name);
                case 'location':
                    return new _1.Location(obj.latitude, obj.longitude);
                default:
                    this.logger.error('Unknown type: ' + type, obj);
                    return null;
            }
        });
    }
    startReceiver() {
        return __awaiter(this, void 0, void 0, function* () {
            this.bot.on('message', (msg) => __awaiter(this, void 0, void 0, function* () {
                const chatId = msg.chat.id;
                let attachment = null;
                let attachmentType;
                for (let type of 'document,photo,location'.split(','))
                    if (msg[type]) {
                        attachment = msg[type];
                        attachmentType = type;
                    }
                if (attachment !== null) {
                    attachment = yield this.parseAttachment(attachmentType, attachment);
                }
                let text = msg.caption || msg.text || '';
                let user = yield this.getUserFromApiData(msg.from);
                let chat = null;
                if ('group,supergroup,channel'.includes(msg.chat.type))
                    chat = yield this.getChatFromApiData(msg.chat);
                let isChat = !!chat;
                let message = new _1.MessageEvent({
                    api: this,
                    attachment,
                    text: text,
                    user,
                    chat: isChat ? chat : undefined,
                    replyTo: undefined,
                    messageId: msg.message_id
                });
                message.user.messageId = msg.message_id;
                if (message.chat)
                    message.chat.messageId = msg.message_id;
                this.emit('message', message);
            }));
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
        return __awaiter(this, void 0, void 0, function* () {
            let photoFile = this.photoCache.get('TG:PHOTO:' + data.id);
            if (!photoFile) {
                let photoD = yield this.bot.getUserProfilePhotos(data.id);
                photoD = photoD.photos[photoD.photos.length - 1];
                photoD = photoD[photoD.length - 1];
                photoFile = yield this.bot.getFileLink(photoD.file_id);
                this.photoCache.set('TG:PHOTO:' + data.id, photoFile);
            }
            return new _1.User({
                messageId: null,
                api: this,
                uid: 'TG.' + data.id,
                targetId: data.id,
                nickName: data.username || data.first_name,
                firstName: data.first_name || data.username,
                lastName: data.last_name || '',
                gender: _1.Gender.MAN,
                photoUrl: photoFile,
                profileUrl: 'https://telegram.me/' + data.username
            });
        });
    }
    getChatFromApiData(data) {
        return __awaiter(this, void 0, void 0, function* () {
            return new _1.Chat({
                messageId: null,
                api: this,
                cid: 'TGC.' + data.id,
                targetId: data.id,
                title: data.title,
                users: [],
                admins: [],
                photoUrl: 'http://www.myiconfinder.com/uploads/iconsets/256-256-b381526610eb3ed95c7fdf75f1ec54d5.png'
            });
        });
    }
    sendLocation(targetId, answer, caption, location, options) {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    sendText(targetId, answer, text, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let opts = {};
            if (options.keyboard) {
                opts.reply_markup = {
                    inline_keyboard: options.keyboard.map(row => row.map(btn => ({ text: btn[0], callback_data: btn[1] })))
                };
            }
            yield this.bot.sendMessage(targetId, text, __assign({ reply_to_message_id: answer }, options.keyboard));
        });
    }
    sendImageStream(targetId, answer, caption, image, options) {
        return __awaiter(this, void 0, void 0, function* () {
            image.stream.path = 'aaaaa.jpeg';
            yield this.bot.sendPhoto(targetId, image.stream, {
                reply_to_message_id: answer,
                caption
            });
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
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TGApi;
//# sourceMappingURL=tg.js.map