"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const logger_1 = require("@meteor-it/logger");
const EventEmitter_1 = require("./EventEmitter");
const fs_1 = require("@meteor-it/fs");
const xrest_1 = require("@meteor-it/xrest");
const utils_1 = require("@meteor-it/utils");
const TimingData_js_1 = require("./TimingData.js");
const POSSIBLE_ACTIONS = ['writing'];
class XBot extends EventEmitter_1.default {
    constructor(name) {
        super();
        this.apiList = [];
        this.name = name;
        this.logger = new logger_1.default(name);
    }
    attachApi(api) {
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
        let timing = message.timing;
        timing.stop();
        message.sourceApi = sourceApi;
        timing.start('Xbot extension');
        message.attachXBot(this);
        timing.stop();
        timing.start('Console log');
        let inChat = message.chat ? (` [${message.chat.title.red}]`) : '';
        let attachment = message.attachment ? (`A`.magenta) : ' ';
        let reply = message.replyTo ? (`R`.magenta) : ' ';
        let lastName = message.user.lastName ? ` ${message.user.lastName.blue}` : '';
        this.logger.log(`<${message.user.firstName.blue}${lastName}${inChat}>[${attachment}${reply}]\n${message.text}`);
        timing.stop();
        timing.start('XBot <=> Ayzek transfer');
        this.emit('message', message);
    }
    onLeave(leave, sourceApi) {
        leave.sourceApi = sourceApi;
        leave.attachXBot(this);
        let initiator = leave.initiator ? ` (by ${leave.initiator.firstName.blue} ${leave.initiator.lastName.blue})` : '';
        let lastName = leave.user.lastName ? ` ${leave.user.lastName.blue}` : '';
        this.logger.log(`${leave.user.firstName.blue}${lastName} {red}leaved{/red} ${leave.chat.title.red}${initiator}`);
        this.emit('leave', leave);
    }
    onJoin(join, sourceApi) {
        join.sourceApi = sourceApi;
        join.attachXBot(this);
        let initiator = join.initiator ? ` (by ${join.initiator.firstName.blue} ${join.initiator.lastName.blue})` : '';
        let lastName = join.user.lastName ? ` ${join.user.lastName.blue}` : '';
        this.logger.log(`${join.user.firstName.blue}${lastName} {green}joined{/green} ${join.chat.title.red}${initiator}`);
        this.emit('join', join);
    }
    onAction(action, sourceApi) {
        action.sourceApi = sourceApi;
        action.attachXBot(this);
        let inChat = action.chat ? (` [${action.chat.title.red}]`) : '';
        let lastName = action.user.lastName ? ` ${action.user.lastName.blue}` : '';
        this.logger.log(`${action.user.firstName.blue}${lastName}${inChat} - ${action.action.yellow}`);
        this.emit('action', action);
    }
    onPhoto(photo, sourceApi) {
        photo.sourceApi = sourceApi;
        photo.attachXBot(this);
        let lastName = photo.initiator.lastName ? ` ${photo.initiator.lastName.blue}` : '';
        this.logger.log(`Changed photo in ${photo.chat.title.red} -> ${photo.newPhotoUrl} by ${photo.initiator.firstName}${lastName}`);
        this.emit('photo', photo);
    }
    onTitle(title, sourceApi) {
        title.sourceApi = sourceApi;
        title.attachXBot(this);
        let lastName = title.initiator.lastName ? ` ${title.initiator.lastName.blue}` : '';
        this.logger.log(title.oldTitle.red + ' -> ' + title.newTitle.green + ' by ' + title.initiator.firstName + lastName);
        this.emit('title', title);
    }
    uGetUser(uid) {
        return __awaiter(this, void 0, void 0, function* () {
            let found = null;
            for (let i = 0; i < this.apiList.length; i++) {
                try {
                    found = yield this.apiList[i].uGetUser(uid);
                    if (found)
                        break;
                }
                catch (e) { }
            }
            return found;
        });
    }
    uGetChat(cid) {
        return __awaiter(this, void 0, void 0, function* () {
            let found = null;
            for (let i = 0; i < this.apiList.length; i++) {
                try {
                    found = yield this.apiList[i].uGetChat(cid);
                    if (found)
                        break;
                }
                catch (e) { }
            }
            return found;
        });
    }
    onWaitNext(...args) {
        this.logger.warn(`onWaitNext should be implemented in extender class!`);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = XBot;
class NotImplementedInApiError extends Error {
    constructor(method) {
        super('Not implemented in api: ' + method + '()');
    }
}
class Api extends EventEmitter_1.default {
    constructor(name) {
        super();
        this.logged = false;
        this.name = name;
        this.logger = new logger_1.default(name);
    }
    auth(...params) {
        throw new NotImplementedInApiError('auth');
    }
    uGetUser(uid) {
        throw new NotImplementedInApiError('uGetUser');
    }
    uGetChat(cid) {
        throw new NotImplementedInApiError('uGetChat');
    }
    sendLocation(targetId, answer, caption, location, options) {
        throw new NotImplementedInApiError('sendLocation');
    }
    sendText(targetId, answer, text, options) {
        throw new NotImplementedInApiError('sendText');
    }
    sendImageStream(targetId, answer, caption, image, options) {
        throw new NotImplementedInApiError('sendImageStream');
    }
    sendFileStream(targetId, answer, caption, file, options) {
        throw new NotImplementedInApiError('sendFileStream');
    }
    sendAudioStream(targetId, answer, caption, audio, options) {
        throw new NotImplementedInApiError('sendAudioStream');
    }
    sendCustom(targetId, answer, caption, options) {
        throw new NotImplementedInApiError('sendCustom');
    }
}
exports.Api = Api;
class Location {
    constructor(lat, long) {
        this.lat = lat;
        this.long = long;
    }
}
exports.Location = Location;
class MessengerSpecific {
    constructor(type, data) {
        this.type = type;
        this.data = data;
    }
}
exports.MessengerSpecific = MessengerSpecific;
class BaseFile {
    constructor(stream, size, name) {
        this.type = 'file';
        if (isNaN(size))
            throw new Error('Wrong file size! ' + size);
        this.stream = stream;
        this.name = name;
        this.size = size;
    }
}
exports.BaseFile = BaseFile;
class File extends BaseFile {
    constructor(stream, size, name, mime = 'text/plain') {
        super(stream, size, name);
        this.mime = mime;
    }
    static fromBuffer(buffer, name, mime) {
        return __awaiter(this, void 0, void 0, function* () {
            return new File(utils_1.createReadStream(buffer), buffer.length, name, mime);
        });
    }
    static fromUrl(url, name, mime) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield xrest_1.emit(`GET ${url} STREAM`);
            let size = +res.headers['content-length'];
            return new File(res, size, name, mime);
        });
    }
    static fromFilePath(path, name, mime) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(yield fs_1.isFile(path)))
                throw new Error('This is not a file! ' + path);
            let size = (yield fs_1.stat(path)).size;
            return new File(fs_1.getReadStream(path), size, name, mime);
        });
    }
}
exports.File = File;
class Image extends BaseFile {
    constructor(stream, size) {
        super(stream, size, 'image.jpg');
    }
    static fromUrl(url) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield xrest_1.emit(`GET ${url}`);
            let size = parseInt(res.headers['content-length'], 10);
            return new Image(utils_1.createReadStream(res.raw), size);
        });
    }
    static fromFilePath(path) {
        return __awaiter(this, void 0, void 0, function* () {
            let size = (yield fs_1.stat(path)).size;
            return new Image(fs_1.getReadStream(path), size);
        });
    }
    static fromCanvas(canvas) {
        return __awaiter(this, void 0, void 0, function* () {
            let fullStream = canvas.jpegStream({
                bufsize: 4096,
                quality: 100,
                progressive: true
            });
            let buffer = yield utils_1.readStream(fullStream);
            return new Image(utils_1.createReadStream(buffer), buffer.length);
        });
    }
}
exports.Image = Image;
class Audio extends BaseFile {
    constructor(stream, size, artist, title) {
        super(stream, size, `${artist} ${title}.mp3`);
    }
    static fromUrl(url, artist, title) {
        return __awaiter(this, void 0, void 0, function* () {
            let res = yield xrest_1.emit(`GET ${url} STREAM`);
            let size = res.headers['content-length'];
            return new Audio(res, size, artist, title);
        });
    }
    static fromFilePath(path, artist, title) {
        return __awaiter(this, void 0, void 0, function* () {
            let size = (yield fs_1.stat(path)).size;
            return new Audio(fs_1.getReadStream(path), size, artist, title);
        });
    }
}
exports.Audio = Audio;
var Role;
(function (Role) {
    Role[Role["CREATOR"] = 1] = "CREATOR";
    Role[Role["MODERATOR"] = 2] = "MODERATOR";
    Role[Role["USER"] = 3] = "USER";
})(Role = exports.Role || (exports.Role = {}));
var Gender;
(function (Gender) {
    Gender[Gender["MAN"] = 1] = "MAN";
    Gender[Gender["WOMAN"] = 2] = "WOMAN";
    Gender[Gender["OTHER"] = 3] = "OTHER";
})(Gender = exports.Gender || (exports.Gender = {}));
class ForwardedMessage {
    constructor({ text, sender, attachment }) {
        this.text = text;
        this.sender = sender;
        this.attachment = attachment;
    }
}
exports.ForwardedMessage = ForwardedMessage;
class Conversation {
    constructor(api, targetId, messageId) {
        this.api = api;
        this.targetId = targetId;
        this.messageId = messageId;
    }
    sendLocation(answer, caption, location, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(location instanceof Location))
                throw new Error('"location" is not a instance of Location!');
            if (this.xbot) {
                let inChat = (this instanceof Chat) ? (` [${this.title.red}]`) : '';
                let attachment = true ? (`A`.magenta) : ' ';
                let reply = answer ? (`R`.magenta) : ' ';
                this.xbot.logger.log(`<${'Ayzek'.blue} ${'Azimov'.blue}${inChat}>[${attachment}${reply}]${(`\n${caption}` || '')}`);
            }
            return yield this.api.sendLocation(this.targetId, answer, caption, location, options);
        });
    }
    sendText(answer, text, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.xbot) {
                let inChat = (this instanceof Chat) ? (` [${this.title.red}]`) : '';
                let attachment = false ? (`A`.magenta) : ' ';
                let reply = answer ? (`R`.magenta) : ' ';
                this.xbot.logger.log(`<${'Ayzek'.blue} ${'Azimov'.blue}${inChat}>[${attachment}${reply}]\n${text.green}`);
            }
            return yield this.api.sendText(this.targetId, answer ? this.messageId : undefined, text, options);
        });
    }
    sendImage(answer, caption, image, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(image instanceof Image))
                throw new Error('"image" is not a instance of Image!');
            if (this.xbot) {
                let inChat = (this instanceof Chat) ? (` [${this.title.red}]`) : '';
                let attachment = true ? (`A`.magenta) : ' ';
                let reply = answer ? (`R`.magenta) : ' ';
                this.xbot.logger.log(`<${'Ayzek'.blue} ${'Azimov'.blue}${inChat}>[${attachment}${reply}]${(`\n${caption}` || '')}`);
            }
            return yield this.api.sendImageStream(this.targetId, answer ? this.messageId : undefined, caption, image, options);
        });
    }
    sendFile(answer, caption, file, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(file instanceof File))
                throw new Error('"file" is not a instance of File!');
            if (this.xbot) {
                let inChat = (this instanceof Chat) ? (` [${this.title.red}]`) : '';
                let attachment = true ? (`A`.magenta) : ' ';
                let reply = answer ? (`R`.magenta) : ' ';
                this.xbot.logger.log(`<${'Ayzek'.blue} ${'Azimov'.blue}${inChat}>[${attachment}${reply}]${(`\n${caption}` || '')}`);
            }
            return yield this.api.sendFileStream(this.targetId, answer ? this.messageId : undefined, caption, file, options);
        });
    }
    sendAudio(answer, caption, audio, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(audio instanceof Audio))
                throw new Error('"audio" is not a instance of Audio!');
            if (this.xbot) {
                let inChat = (this instanceof Chat) ? (` [${this.title.red}]`) : '';
                let attachment = true ? (`A`.magenta) : ' ';
                let reply = answer ? (`R`.magenta) : ' ';
                this.xbot.logger.log(`<${'Ayzek'.blue} ${'Azimov'.blue}${inChat}>[${attachment}${reply}]${(`\n${caption}` || '')}`);
            }
            return yield this.api.sendAudioStream(this.targetId, answer ? this.messageId : undefined, caption, audio, options);
        });
    }
    sendVoice(answer, caption, file, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!(file instanceof File))
                throw new Error('"file" is not a instance of File!');
            if (this.xbot) {
                let inChat = (this instanceof Chat) ? (` [${this.title.red}]`) : '';
                let attachment = true ? (`A`.magenta) : ' ';
                let reply = answer ? (`R`.magenta) : ' ';
                this.xbot.logger.log(`<${'Ayzek'.blue} ${'Azimov'.blue}${inChat}>[${attachment}${(`\n${reply}` || '')}]`);
            }
            return yield this.api.sendVoiceStream(this.targetId, answer ? this.messageId : undefined, caption, file, options);
        });
    }
    sendCustom(answer, caption, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.api.sendCustom(this.targetId, answer ? this.messageId : undefined, caption, options);
        });
    }
}
exports.Conversation = Conversation;
class User extends Conversation {
    constructor({ api, uid, targetId, nickName = null, firstName, lastName, gender, photoUrl, role = Role.USER, profileUrl, messageId }) {
        super(api, targetId, messageId);
        this.isUser = true;
        this.isChat = false;
        this.uid = uid;
        this.nickName = nickName;
        this.firstName = firstName;
        this.lastName = lastName;
        this.gender = gender;
        this.photoUrl = photoUrl;
        this.profileUrl = profileUrl;
    }
    getPhotoImage() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Image.fromUrl(this.photoUrl);
        });
    }
    getName() {
        if (this.nickName)
            return this.nickName;
        else
            return this.firstName;
    }
    getFullName() {
        let name = '';
        if (this.firstName)
            name += this.firstName + ' ';
        if (this.lastName)
            name += this.lastName + ' ';
        if (this.nickName)
            name += `(${this.nickName}) `;
        return name.trim();
    }
    waitNew(...args) {
        return this.xbot.onWaitNext(this, ...args);
    }
}
exports.User = User;
class Chat extends Conversation {
    constructor({ api, cid, targetId, title, users, admins, messageId, photoUrl }) {
        super(api, targetId, messageId);
        this.isUser = false;
        this.isChat = true;
        this.cid = cid;
        this.users = users;
        this.title = title;
        this.admins = admins;
        this.photoUrl = photoUrl;
    }
    isAdmin(user) {
        return ~this.admins.indexOf(user) || user.role === Role.CREATOR;
    }
    getPhotoImage() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Image.fromUrl(this.photoUrl);
        });
    }
    waitNew(...args) {
        return this.xbot.onWaitNext(this, ...args);
    }
}
exports.Chat = Chat;
class MessageEvent extends Conversation {
    constructor(data) {
        super(data.api, data.chat ? data.chat.targetId : data.user.targetId, data.messageId);
        this.isUser = true;
        this.attachment = data.attachment;
        this.text = data.text;
        this.user = data.user;
        this.chat = data.chat;
        this.timing = data.timing || new TimingData_js_1.default();
        this.replyTo = data.replyTo;
    }
    get isChat() {
        return !!this.chat;
    }
    attachXBot(xbot) {
        this.xbot = xbot;
        if (this.chat)
            this.chat.xbot = xbot;
        this.user.xbot = xbot;
    }
}
exports.MessageEvent = MessageEvent;
class JoinEvent {
    constructor(data) {
        this.user = data.user;
        this.chat = data.chat;
        this.initiator = data.initiator;
        this.timing = data.timing || new TimingData_js_1.default();
    }
    attachXBot(xbot) {
        this.xbot = xbot;
        this.chat.xbot = xbot;
        this.user.xbot = xbot;
        if (this.initiator)
            this.initiator.xbot = xbot;
    }
}
exports.JoinEvent = JoinEvent;
class ActionEvent {
    constructor(data) {
        this.action = data.action;
        this.user = data.user;
        this.chat = data.chat;
        this.data = data.data;
        this.timing = data.timing || new TimingData_js_1.default();
    }
    attachXBot(xbot) {
        this.xbot = xbot;
        if (this.chat)
            this.chat.xbot = xbot;
        this.user.xbot = xbot;
    }
}
exports.ActionEvent = ActionEvent;
class LeaveEvent {
    constructor(data) {
        this.user = data.user;
        this.chat = data.chat;
        this.initiator = data.initiator;
        this.timing = data.timing || new TimingData_js_1.default();
    }
    attachXBot(xbot) {
        this.xbot = xbot;
        this.chat.xbot = xbot;
        this.user.xbot = xbot;
    }
}
exports.LeaveEvent = LeaveEvent;
class TitleChangeEvent {
    constructor(data) {
        this.oldTitle = data.oldTitle;
        this.newTitle = data.newTitle;
        this.initiator = data.initiator;
        this.chat = data.chat;
        this.timing = data.timing || new TimingData_js_1.default();
    }
    attachXBot(xbot) {
        this.xbot = xbot;
        this.chat.xbot = xbot;
        this.initiator.xbot = xbot;
    }
}
exports.TitleChangeEvent = TitleChangeEvent;
class PhotoChangeEvent {
    constructor(data) {
        this.newPhotoUrl = data.newPhotoUrl;
        this.initiator = data.initiator;
        this.chat = data.chat;
        this.timing = data.timing || new TimingData_js_1.default();
    }
    attachXBot(xbot) {
        this.xbot = xbot;
        this.chat.xbot = xbot;
        this.initiator.xbot = xbot;
    }
}
exports.PhotoChangeEvent = PhotoChangeEvent;
//# sourceMappingURL=index.js.map