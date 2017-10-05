"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
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
const queue_1 = require("@meteor-it/queue");
const xrest_1 = require("@meteor-it/xrest");
const multipart = require("@meteor-it/xrest/multipart");
const utils_1 = require("@meteor-it/utils");
const TimingData_js_1 = require("../TimingData.js");
const OFFICIAL_SCOPES = ['audio'];
const EXECUTE_IN_SINGLE = [
    'docs.save',
    'video.save',
    'docs.getUploadServer',
    'photos.saveMessagesPhoto',
    'photos.getMessagesUploadServer'
];
const SPACE_REPLACE = String.fromCharCode(8194);
class VKApi extends _1.Api {
    constructor() {
        super('VKAPI');
        this.logged = false;
        this.tokens = [];
        this.uploadToken = '';
        this.tokenId = 0;
        this.cache = new Map();
    }
    auth(tokens) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (!(tokens instanceof Array)) {
                    this.logger.warn('Use multiple tokens, luke!');
                    tokens = [tokens];
                }
                if (tokens.length < 2) {
                    throw new Error('Minimal token count is 2');
                }
                this.logged = true;
                this.uploadToken = tokens.pop();
                this.tokens = tokens;
                this.xrest = new xrest_1.default('https://api.vk.com/', {});
                this.logger.log('Starting always online mode...');
                yield this.execute('account.setOnline');
                setInterval(() => __awaiter(this, void 0, void 0, function* () {
                    yield this.execute('account.setOnline');
                    this.logger.log('Updated online mode!');
                }), 60 * 1000 * 5);
                this.logger.log('Done!');
                yield this.startReceiver();
            }
            catch (e) {
                this.logger.error(e.stack);
                throw new Error('Error at auth()!');
            }
        });
    }
    execute(method, params = {}) { throw new Error('execute() was called, WTF?!'); }
    executeMulti(tasks) {
        return __awaiter(this, void 0, void 0, function* () {
            let code = 'return [';
            let tasksCodes = [];
            let needsToBeExecutedInSingle = false;
            tasks.forEach(([method, params]) => {
                if (EXECUTE_IN_SINGLE.includes(method))
                    needsToBeExecutedInSingle = true;
                tasksCodes.push(`API.${method}(${JSON.stringify(params || {})})`);
            });
            code += tasksCodes.join(',');
            code += '];';
            let token = this.tokens[this.tokenId];
            this.tokenId++;
            if (this.tokenId === this.tokens.length)
                this.tokenId = 0;
            if (needsToBeExecutedInSingle)
                token = this.uploadToken;
            let res = yield this.xrest.emit(`POST /method/execute`, { data: {
                    code
                }, query: {
                    v: '5.63',
                    access_token: token
                } });
            let responses = res.body.response;
            if (res.body.error || !responses) {
                if (res.body.error.error_code === 14) {
                    return tasks.map(([method, params]) => {
                        return this.execute(method, params);
                    });
                }
                else {
                    return tasks.map((task, id) => {
                        return new Error(res.body.error.error_msg);
                    });
                }
            }
            else
                return tasks.map((task, id) => {
                    return responses[id];
                });
        });
    }
    getUser(user, onlyCached = false) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.getUsers([user]))[0];
        });
    }
    getUserFromApiData(data) {
        let gender = 0;
        switch (data.sex) {
            case 1:
                gender = _1.Gender.WOMAN;
                break;
            case 2:
                gender = _1.Gender.MAN;
                break;
            default: gender = _1.Gender.OTHER;
        }
        let userConv = new _1.User({
            messageId: null,
            api: this,
            uid: 'VK.' + data.id,
            targetId: data.id,
            nickName: data.nickname || null,
            firstName: data.first_name,
            lastName: data.last_name,
            gender: gender,
            photoUrl: data.photo_max_orig,
            profileUrl: 'https://vk.com/' + (data.domain || ("id" + data.uid))
        });
        return userConv;
    }
    getUsers(users_orig) {
        return __awaiter(this, void 0, void 0, function* () {
            let users = users_orig.slice(0);
            let MAX_EXECUTIONS_ONE_TIME = 1000;
            this.logger.debug('Before: ' + users.length);
            users.filter(user => !!user);
            this.logger.debug('After: ' + users.length);
            let result = [];
            while (users.length > 0) {
                this.logger.debug('Getting packet of users');
                let curDep = new Set();
                for (let i = 0; i < MAX_EXECUTIONS_ONE_TIME && users.length > 0; i++) {
                    curDep.add(users.shift());
                }
                this.logger.debug('Getting cached');
                yield utils_1.asyncEach(curDep, (cur) => __awaiter(this, void 0, void 0, function* () {
                    let res = this.cache.get('VK:USER:' + cur);
                    if (res) {
                        curDep.delete(cur);
                        result.push(this.getUserFromApiData(res));
                    }
                }));
                this.logger.debug('Total ' + Array.from(curDep).length + ' left to load');
                if (Array.from(curDep).length != 0) {
                    let res = yield this.execute('users.get', {
                        user_ids: Array.from(curDep).join(','),
                        fields: "photo_id,verified,sex,bdate,city,country,home_town,has_photo,photo_50,photo_100,photo_200_orig,photo_200,photo_400_orig,photo_max,photo_max_orig,online,lists,domain,has_mobile,contacts,site,education,universities,schools,status,last_seen,followers_count,common_count,occupation,nickname,relatives,relation,personal,connections,exports,wall_comments,activities,interests,music,movies,tv,books,games,about,quotes,can_post,can_see_all_posts,can_see_audio,can_write_private_message,can_send_friend_request,is_favorite,is_hidden_from_feed,timezone,screen_name,maiden_name,crop_photo,is_friend,friend_status,career,military,blacklisted,blacklisted_by_me"
                    });
                    yield utils_1.asyncEach(res, (r) => __awaiter(this, void 0, void 0, function* () {
                        this.cache.set('VK:USER:' + r.id, r);
                    }));
                    result.push(...res.map(res => {
                        let tres = this.getUserFromApiData(res);
                        return tres;
                    }));
                }
                this.logger.debug('Loaded');
            }
            this.logger.debug('Total: ' + result.length);
            return result;
        });
    }
    getChat(chat) {
        return __awaiter(this, void 0, void 0, function* () {
            chat = chat.toString();
            let key = 'VK:CHAT:' + chat;
            let res = this.cache.get(key);
            if (!res) {
                this.logger.log('Uncached get chat... (%s)', chat);
                res = yield this.execute('messages.getChat', {
                    chat_id: +chat
                });
                this.cache.set(key, res);
            }
            let data = res;
            const chatConv = new _1.Chat({
                messageId: null,
                api: this,
                cid: 'VKC.' + data.id,
                targetId: 2e9 + data.id,
                title: data.title,
                users: yield this.getUsers(data.users),
                admins: [yield this.getUser(data.admin_id)],
                photoUrl: data.photo_200
            });
            return chatConv;
        });
    }
    uGetUser(uid) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!uid.startsWith('VK.'))
                return null;
            let id = uid.substr(3);
            if (!id)
                return null;
            id = +id;
            if (isNaN(id))
                return null;
            return yield this.getUser(id);
        });
    }
    uGetChat(cid) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!cid.startsWith('VKC.'))
                return null;
            let id = cid.substr(4);
            if (!id)
                return null;
            id = +id;
            if (isNaN(id))
                return null;
            return yield this.getChat(id);
        });
    }
    startReceiver() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let data = yield this.execute('messages.getLongPollServer', {});
                if (!data.server) {
                    this.logger.log(data);
                    throw new Error('Can\'t get server!');
                }
                let { key, server, ts } = data;
                this.logger.log('Got receiver data');
                setTimeout(() => this.receive(key, server, ts), 1);
            }
            catch (e) {
                this.logger.error(e);
                process.nextTick(() => this.startReceiver());
            }
        });
    }
    parseAttachment(attachment) {
        return __awaiter(this, void 0, void 0, function* () {
            let result;
            switch (attachment.type) {
                case 'photo':
                    let max = Object.keys(attachment.photo).filter(a => a.startsWith('photo_')).map(a => +a.replace('photo_', ''));
                    result = yield _1.Image.fromUrl(attachment.photo['photo_' + max[max.length - 1]]);
                    break;
                case 'doc':
                    result = yield _1.File.fromUrl(attachment.doc.url, attachment.doc.title);
                    break;
                case 'video':
                    break;
                case 'audio':
                    result = new _1.Audio(null, 0, attachment.audio.artist, attachment.audio.title);
                    break;
                default:
                    this.logger.log(attachment);
            }
            if (result || attachment.type === 'video')
                return result;
            else
                this.logger.error('Not got result for ' + attachment.type);
        });
    }
    receive(key, server, ts) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let result = (yield xrest_1.emit(`GET https://${server}`, {
                    query: {
                        act: 'a_check',
                        key,
                        ts,
                        wait: 25,
                        mode: 66
                    },
                    timeout: 0
                })).body;
                if (result.failed) {
                    switch (result.failed) {
                        case 1:
                            ts = result.ts;
                            process.nextTick(() => this.receive(key, server, ts));
                            return;
                        case 2:
                        case 3:
                            process.nextTick(() => this.startReceiver());
                            return;
                        case 4:
                        default:
                            this.logger.err('Error on receive() call!');
                            process.nextTick(() => this.startReceiver());
                            return;
                    }
                }
                ts = result.ts;
                let user = null;
                let chat = null;
                result.updates.forEach((update) => __awaiter(this, void 0, void 0, function* () {
                    let that = this;
                    try {
                        let type = update.shift();
                        let [flags, user_id, from_id, timestamp, subject, text, attachments, chat_id, message_id, peer_id, local_id, count, extra, mask] = [null, null, null, null, null, null, null, null, null, null, null, null, null, null];
                        switch (type) {
                            case 1:
                            case 2:
                            case 3:
                                [message_id, flags, peer_id] = update;
                                break;
                            case 7:
                            case 6:
                                [peer_id, local_id] = update;
                                if (peer_id > 2e9)
                                    this.getChat(peer_id - 2e9);
                                else
                                    this.getUser(peer_id);
                                break;
                            case 80:
                                [count] = update;
                                break;
                            case 8: {
                                [user_id, extra] = update;
                                user_id = -user_id;
                                let user = yield this.getUser(user_id);
                                this.emit('action', new _1.ActionEvent({
                                    user,
                                    chat: null,
                                    action: 'offline',
                                    data: extra
                                }));
                                break;
                            }
                            case 9: {
                                [user_id, flags] = update;
                                user_id = -user_id;
                                let user = yield this.getUser(user_id);
                                this.emit('action', new _1.ActionEvent({
                                    user,
                                    chat: null,
                                    action: 'online',
                                    data: flags
                                }));
                                break;
                            }
                            case 62: {
                                [user_id, chat_id] = update;
                                let [user, chat] = yield Promise.all([
                                    this.getUser(user_id),
                                    this.getChat(chat_id),
                                ]);
                                this.emit('action', new _1.ActionEvent({
                                    user,
                                    chat,
                                    action: 'writing',
                                    data: null
                                }));
                                break;
                            }
                            case 4: {
                                [message_id, flags, from_id, timestamp, subject, text, attachments] = update;
                                let timing = new TimingData_js_1.default();
                                if (attachments.source_act) {
                                    let event, user, chat, initiator, initiatorP, userP, chatP;
                                    switch (attachments.source_act) {
                                        case 'chat_title_update':
                                            event = new _1.TitleChangeEvent({ oldTitle: attachments.source_old_text, newTitle: attachments.source_text, initiator: yield this.getUser(attachments.from), chat: yield this.getChat(from_id - 2e9) });
                                            this.emit('title', event);
                                            break;
                                        case 'chat_invite_user':
                                            if (attachments.from === attachments.source_mid)
                                                initiatorP = null;
                                            else
                                                initiatorP = this.getUser(attachments.from);
                                            userP = this.getUser(attachments.source_mid);
                                            chatP = this.getChat(from_id - 2e9);
                                            [user, chat, initiator] = yield Promise.all([userP, chatP, initiatorP]);
                                            event = new _1.JoinEvent({ user, chat, initiator });
                                            this.emit('join', event);
                                            break;
                                        case 'chat_kick_user':
                                            initiatorP;
                                            if (attachments.from === attachments.source_mid)
                                                initiatorP = null;
                                            else
                                                initiatorP = this.getUser(attachments.from);
                                            userP = this.getUser(attachments.source_mid);
                                            chatP = this.getChat(from_id - 2e9);
                                            [user, chat, initiator] = yield Promise.all([userP, chatP, initiatorP]);
                                            event = new _1.LeaveEvent({ user, chat, initiator });
                                            this.emit('leave', event);
                                            break;
                                        default:
                                            this.logger.error('Unhandled event: ' + attachments.source_act, attachments);
                                    }
                                    return;
                                }
                                if ((flags & 2) == 2)
                                    return;
                                let realMessageNeeded = false;
                                if (attachments.geo || attachments.fwd || attachments.attach1_type)
                                    realMessageNeeded = true;
                                let realMessage;
                                let forwarded;
                                let attachment;
                                if (realMessageNeeded) {
                                    timing.start('Get real msg');
                                    realMessage = (yield this.execute('messages.getById', {
                                        message_ids: message_id
                                    })).items[0];
                                    timing.stop();
                                }
                                if (attachments.fwd) {
                                    timing.start('Parse forwarded');
                                    let fwd = realMessage.fwd_messages[0];
                                    forwarded = new _1.ForwardedMessage({
                                        text: fwd.body,
                                        sender: yield this.getUser(fwd.user_id),
                                        attachment: fwd.attachments ? (yield this.parseAttachment(fwd.attachments[0])) : undefined
                                    });
                                    timing.stop();
                                }
                                if (attachments.geo) {
                                    timing.start('GeoDB');
                                    let [lat, long] = realMessage.geo.coordinates.split(' ');
                                    attachment = new _1.Location(lat, long);
                                    timing.stop();
                                }
                                else if (realMessage && realMessage.attachments) {
                                    timing.start('Real msg attachment');
                                    attachment = yield this.parseAttachment(realMessage.attachments[0]);
                                    timing.stop();
                                }
                                timing.start('Getting sender');
                                let sender_id = from_id > 2e9 ? attachments.from : from_id;
                                let isChat = from_id > 2e9;
                                let user = yield this.getUser(sender_id);
                                if (user.targetId === undefined) {
                                    this.logger.warn('NullUser');
                                    return;
                                }
                                timing.stop();
                                let message = new _1.MessageEvent({
                                    api: this,
                                    attachment,
                                    text: decodeText(text),
                                    user,
                                    chat: isChat ? (yield this.getChat(from_id - 2e9)) : undefined,
                                    replyTo: forwarded,
                                    messageId: message_id,
                                    timing
                                });
                                message.user.messageId = message_id;
                                if (isChat)
                                    message.chat.messageId = message_id;
                                timing.start('Adapter <=> Xbot transfer');
                                this.emit('message', message);
                                break;
                            }
                            default:
                                this.logger.err('Unhandled type: ' + type + ', update is ' + update);
                        }
                    }
                    catch (e) {
                        this.logger.error('Error while processing update:');
                        this.logger.error(e);
                    }
                }));
                setTimeout(() => this.receive(key, server, ts), 1);
            }
            catch (e) {
                this.logger.error(e);
                setTimeout(() => this.startReceiver(), 1);
            }
        });
    }
    randomId() {
        return Math.round(Math.random() * 30000000);
    }
    static processText(text) {
        return text.replace(/ /g, SPACE_REPLACE);
    }
    sendLocation(targetId, answer, caption, location, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.execute("messages.send", {
                peer_id: targetId,
                message: VKApi.processText(caption),
                forward_messages: answer ? answer : "",
                random_id: this.randomId(),
                lat: location.lat,
                long: location.long
            });
        });
    }
    sendText(targetId, answer, text, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.execute('messages.send', {
                peer_id: targetId,
                forward_messages: answer ? answer : "",
                message: VKApi.processText(text),
                random_id: this.randomId()
            });
        });
    }
    sendCommonAttachment(targetId, answer, caption, attachmentId, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.execute("messages.send", {
                peer_id: targetId,
                forward_messages: answer ? answer : "",
                message: VKApi.processText(caption),
                attachment: attachmentId,
                random_id: this.randomId()
            });
        });
    }
    sendImageStream(targetId, answer, caption, image, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let server = yield this.execute('photos.getMessagesUploadServer', {});
            let res = yield xrest_1.emit(`POST ${server.upload_url}`, {
                multipart: true,
                timeout: 50000,
                data: {
                    photo: new multipart.FileStream(image.stream, image.name, image.size, 'binary', 'image/jpeg')
                }
            });
            let res2 = yield this.execute('photos.saveMessagesPhoto', {
                photo: res.body.photo,
                server: res.body.server,
                hash: res.body.hash
            });
            if (!res2[0])
                console.log(res2, res.body);
            yield this.sendCommonAttachment(targetId, answer, VKApi.processText(caption), `photo${res2[0].owner_id}_${res2[0].id}`, options);
        });
    }
    sendFileStream(targetId, answer, caption, file, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let server = yield this.execute('docs.getUploadServer', {});
            let res = yield xrest_1.emit(`POST ${server.upload_url}`, {
                multipart: true,
                timeout: 50000,
                data: {
                    file: new multipart.FileStream(file.stream, file.name, file.size, 'binary', 'text/plain')
                }
            });
            let res2 = yield this.execute('docs.save', {
                file: res.body.file,
                title: file.name
            });
            yield this.sendCommonAttachment(targetId, answer, VKApi.processText(caption), `doc${res2[0].owner_id}_${res2[0].id}`, options);
        });
    }
    sendVoiceStream(targetId, answer, caption, file, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let server = yield this.execute('docs.getUploadServer', {
                type: 'audio_message'
            });
            console.log(file.size, server);
            let res = yield xrest_1.emit(`POST ${server.upload_url}`, {
                multipart: true,
                timeout: 50000,
                data: {
                    file: new multipart.FileStream(file.stream, '123.ogg', file.size, 'binary', 'text/plain')
                }
            });
            let res2 = yield this.execute('docs.save', {
                file: res.body.file,
                title: ''
            });
            yield this.sendCommonAttachment(targetId, answer, VKApi.processText(caption), `doc${res2[0].owner_id}_${res2[0].id}`, options);
        });
    }
    sendAudioStream(targetId, answer, caption, audio, options) {
        return __awaiter(this, void 0, void 0, function* () {
            throw new Error('sendAudioStream() not implemented!');
        });
    }
    sendCustom(targetId, answer, caption, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (options.ytVideo) {
                let res1 = yield this.execute('video.save', {
                    link: options.ytVideo
                });
                let res2 = yield xrest_1.emit('POST ' + res1.upload_url);
                yield this.sendCommonAttachment(targetId, answer, VKApi.processText(caption), `video${res1.owner_id}_${res1.video_id}`, options);
            }
        });
    }
}
__decorate([
    queue_1.default(600, 3, 'executeMulti'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VKApi.prototype, "execute", null);
__decorate([
    queue_1.default(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VKApi.prototype, "getUsers", null);
__decorate([
    queue_1.default(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VKApi.prototype, "getChat", null);
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = VKApi;
function decodeText(text) {
    return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<br>/g, '\n').replace(/&quot;/g, '"').replace(/«/g, '<<').replace(/»/g, '>>').replace(/—/g, '--');
}
//# sourceMappingURL=vk.js.map