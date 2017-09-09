var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
(function (dependencies, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    }
})(["require", "exports", "../", "@meteor-it/queue", "@meteor-it/xrest", "@meteor-it/xrest/multipart", "@meteor-it/utils", "../TimingData.js"], function (require, exports) {
    "use strict";
    var _1 = require("../");
    var queue_1 = require("@meteor-it/queue");
    var xrest_1 = require("@meteor-it/xrest");
    var multipart = require("@meteor-it/xrest/multipart");
    var utils_1 = require("@meteor-it/utils");
    var TimingData_js_1 = require("../TimingData.js");
    var OFFICIAL_SCOPES = ['audio'];
    var EXECUTE_IN_SINGLE = [
        'docs.save',
        'video.save',
        'docs.getUploadServer',
        'photos.saveMessagesPhoto',
        'photos.getMessagesUploadServer'
    ];
    var SPACE_REPLACE = String.fromCharCode(8194);
    var VKApi = (function (_super) {
        __extends(VKApi, _super);
        function VKApi() {
            var _this = _super.call(this, 'VKAPI') || this;
            _this.logged = false;
            _this.tokens = [];
            _this.uploadToken = '';
            _this.tokenId = 0;
            _this.cache = new Map();
            return _this;
        }
        VKApi.prototype.auth = function (tokens) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                var e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 3, , 4]);
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
                            return [4 /*yield*/, this.execute('account.setOnline')];
                        case 1:
                            _a.sent();
                            setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, this.execute('account.setOnline')];
                                        case 1:
                                            _a.sent();
                                            this.logger.log('Updated online mode!');
                                            return [2 /*return*/];
                                    }
                                });
                            }); }, 60 * 1000 * 5);
                            this.logger.log('Done!');
                            return [4 /*yield*/, this.startReceiver()];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            e_1 = _a.sent();
                            this.logger.error(e_1.stack);
                            throw new Error('Error at auth()!');
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        // execute - dummy method for typescript support
        VKApi.prototype.execute = function (method, params) {
            if (params === void 0) { params = {}; }
            throw new Error('execute() was called, WTF?!');
        };
        // executeMulti - wraps multiple calls into single execute method call
        VKApi.prototype.executeMulti = function (tasks) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                var code, tasksCodes, needsToBeExecutedInSingle, token, res, responses;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            code = 'return [';
                            tasksCodes = [];
                            needsToBeExecutedInSingle = false;
                            tasks.forEach(function (_a) {
                                var method = _a[0], params = _a[1];
                                if (EXECUTE_IN_SINGLE.includes(method))
                                    needsToBeExecutedInSingle = true;
                                tasksCodes.push("API." + method + "(" + JSON.stringify(params || {}) + ")");
                            });
                            code += tasksCodes.join(',');
                            code += '];';
                            token = this.tokens[this.tokenId];
                            this.tokenId++;
                            if (this.tokenId === this.tokens.length)
                                this.tokenId = 0;
                            if (needsToBeExecutedInSingle)
                                token = this.uploadToken;
                            return [4 /*yield*/, this.xrest.emit("POST /method/execute", { data: {
                                        code: code
                                    }, query: {
                                        v: '5.63',
                                        access_token: token
                                    } })];
                        case 1:
                            res = _a.sent();
                            responses = res.body.response;
                            if (res.body.error || !responses) {
                                if (res.body.error.error_code === 14) {
                                    // Process captcha
                                    // console.log(res.body.error.captcha_sid,res.body.error.captcha_img);
                                    // this.logger.warn('Waiting 15s for captcha skip...');
                                    // await new Promise(res=>setTimeout(()=>res(),15000));
                                    // return await this.executeMulti(tasks);
                                    // Add tasks to end
                                    return [2 /*return*/, tasks.map(function (_a) {
                                            var method = _a[0], params = _a[1];
                                            return _this.execute(method, params);
                                        })];
                                }
                                else {
                                    return [2 /*return*/, tasks.map(function (task, id) {
                                            return new Error(res.body.error.error_msg);
                                        })];
                                }
                            }
                            else
                                return [2 /*return*/, tasks.map(function (task, id) {
                                        return responses[id];
                                    })];
                            return [2 /*return*/];
                    }
                });
            });
        };
        VKApi.prototype.getUser = function (user, onlyCached) {
            if (onlyCached === void 0) { onlyCached = false; }
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.getUsers([user])];
                        case 1: return [2 /*return*/, (_a.sent())[0]];
                    }
                });
            });
        };
        VKApi.prototype.getUserFromApiData = function (data) {
            var gender = 0;
            switch (data.sex) {
                case 1:
                    gender = _1.Gender.WOMAN;
                    break;
                case 2:
                    gender = _1.Gender.MAN;
                    break;
                default: gender = _1.Gender.OTHER;
            }
            // Roles, config and state are managed by plugins
            var userConv = new _1.User({
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
        };
        VKApi.prototype.getUsers = function (users_orig) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                var users, MAX_EXECUTIONS_ONE_TIME, result, _loop_1, this_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            users = users_orig.slice(0);
                            MAX_EXECUTIONS_ONE_TIME = 1000;
                            this.logger.debug('Before: ' + users.length);
                            users.filter(function (user) { return !!user; });
                            this.logger.debug('After: ' + users.length);
                            result = [];
                            _loop_1 = function () {
                                var curDep, i, res;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            this_1.logger.debug('Getting packet of users');
                                            curDep = new Set();
                                            for (i = 0; i < MAX_EXECUTIONS_ONE_TIME && users.length > 0; i++) {
                                                curDep.add(users.shift());
                                            }
                                            this_1.logger.debug('Getting cached');
                                            return [4 /*yield*/, utils_1.asyncEach(curDep, function (cur) { return __awaiter(_this, void 0, void 0, function () {
                                                    var res;
                                                    return __generator(this, function (_a) {
                                                        res = this.cache.get('VK:USER:' + cur);
                                                        if (res) {
                                                            curDep.delete(cur);
                                                            result.push(this.getUserFromApiData(res));
                                                        }
                                                        return [2 /*return*/];
                                                    });
                                                }); })];
                                        case 1:
                                            _a.sent();
                                            this_1.logger.debug('Total ' + Array.from(curDep).length + ' left to load');
                                            if (!(Array.from(curDep).length != 0))
                                                return [3 /*break*/, 4];
                                            return [4 /*yield*/, this_1.execute('users.get', {
                                                    user_ids: Array.from(curDep).join(','),
                                                    fields: "photo_id,verified,sex,bdate,city,country,home_town,has_photo,photo_50,photo_100,photo_200_orig,photo_200,photo_400_orig,photo_max,photo_max_orig,online,lists,domain,has_mobile,contacts,site,education,universities,schools,status,last_seen,followers_count,common_count,occupation,nickname,relatives,relation,personal,connections,exports,wall_comments,activities,interests,music,movies,tv,books,games,about,quotes,can_post,can_see_all_posts,can_see_audio,can_write_private_message,can_send_friend_request,is_favorite,is_hidden_from_feed,timezone,screen_name,maiden_name,crop_photo,is_friend,friend_status,career,military,blacklisted,blacklisted_by_me"
                                                })];
                                        case 2:
                                            res = _a.sent();
                                            return [4 /*yield*/, utils_1.asyncEach(res, function (r) { return __awaiter(_this, void 0, void 0, function () {
                                                    return __generator(this, function (_a) {
                                                        this.cache.set('VK:USER:' + r.id, r);
                                                        return [2 /*return*/];
                                                    });
                                                }); })];
                                        case 3:
                                            _a.sent();
                                            //result.push(...(await asyncEach(res,r=>this.getUserFromApiData(res))));
                                            result.push.apply(result, res.map(function (res) {
                                                var tres = _this.getUserFromApiData(res);
                                                return tres;
                                            }));
                                            _a.label = 4;
                                        case 4:
                                            this_1.logger.debug('Loaded');
                                            return [2 /*return*/];
                                    }
                                });
                            };
                            this_1 = this;
                            _a.label = 1;
                        case 1:
                            if (!(users.length > 0))
                                return [3 /*break*/, 3];
                            return [5 /*yield**/, _loop_1()];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 1];
                        case 3:
                            this.logger.debug('Total: ' + result.length);
                            return [2 /*return*/, result];
                    }
                });
            });
        };
        VKApi.prototype.getChat = function (chat) {
            return __awaiter(this, void 0, void 0, function () {
                var key, res, data, chatConv, _a, _b, _c, _d;
                return __generator(this, function (_e) {
                    switch (_e.label) {
                        case 0:
                            chat = chat.toString();
                            key = 'VK:CHAT:' + chat;
                            res = this.cache.get(key);
                            if (!!res)
                                return [3 /*break*/, 2];
                            this.logger.log('Uncached get chat... (%s)', chat);
                            return [4 /*yield*/, this.execute('messages.getChat', {
                                    chat_id: +chat
                                })];
                        case 1:
                            res = _e.sent();
                            this.cache.set(key, res);
                            _e.label = 2;
                        case 2:
                            data = res;
                            _a = _1.Chat.bind;
                            _c = {
                                messageId: null,
                                api: this,
                                cid: 'VKC.' + data.id,
                                targetId: 2e9 + data.id,
                                title: data.title
                            };
                            return [4 /*yield*/, this.getUsers(data.users)];
                        case 3:
                            _c.users = _e.sent();
                            return [4 /*yield*/, this.getUser(data.admin_id)];
                        case 4:
                            chatConv = new (_a.apply(_1.Chat, [void 0, (_c.admins = [_e.sent()],
                                    _c.photoUrl = data.photo_200,
                                    _c)]))();
                            return [2 /*return*/, chatConv];
                    }
                });
            });
        };
        VKApi.prototype.uGetUser = function (uid) {
            return __awaiter(this, void 0, void 0, function () {
                var id;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!uid.startsWith('VK.'))
                                return [2 /*return*/, null];
                            id = uid.substr(3);
                            if (!id)
                                return [2 /*return*/, null];
                            id = +id;
                            if (isNaN(id))
                                return [2 /*return*/, null];
                            return [4 /*yield*/, this.getUser(id)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        VKApi.prototype.uGetChat = function (cid) {
            return __awaiter(this, void 0, void 0, function () {
                var id;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!cid.startsWith('VKC.'))
                                return [2 /*return*/, null];
                            id = cid.substr(4);
                            if (!id)
                                return [2 /*return*/, null];
                            id = +id;
                            if (isNaN(id))
                                return [2 /*return*/, null];
                            return [4 /*yield*/, this.getChat(id)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        VKApi.prototype.startReceiver = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                var data, key_1, server_1, ts_1, e_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, this.execute('messages.getLongPollServer', {})];
                        case 1:
                            data = _a.sent();
                            if (!data.server) {
                                this.logger.log(data);
                                throw new Error('Can\'t get server!');
                            }
                            key_1 = data.key, server_1 = data.server, ts_1 = data.ts;
                            this.logger.log('Got receiver data');
                            setTimeout(function () { return _this.receive(key_1, server_1, ts_1); }, 1);
                            return [3 /*break*/, 3];
                        case 2:
                            e_2 = _a.sent();
                            this.logger.error(e_2);
                            process.nextTick(function () { return _this.startReceiver(); });
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        VKApi.prototype.parseAttachment = function (attachment) {
            return __awaiter(this, void 0, void 0, function () {
                var result, _a, max;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = attachment.type;
                            switch (_a) {
                                case 'photo': return [3 /*break*/, 1];
                                case 'doc': return [3 /*break*/, 3];
                                case 'video': return [3 /*break*/, 5];
                                case 'audio': return [3 /*break*/, 6];
                            }
                            return [3 /*break*/, 7];
                        case 1:
                            max = Object.keys(attachment.photo).filter(function (a) { return a.startsWith('photo_'); }).map(function (a) { return +a.replace('photo_', ''); });
                            return [4 /*yield*/, _1.Image.fromUrl(attachment.photo['photo_' + max[max.length - 1]])];
                        case 2:
                            result = _b.sent();
                            return [3 /*break*/, 8];
                        case 3: return [4 /*yield*/, _1.File.fromUrl(attachment.doc.url, attachment.doc.title)];
                        case 4:
                            result = _b.sent();
                            return [3 /*break*/, 8];
                        case 5: 
                        //TODO: How to deal with video?
                        return [3 /*break*/, 8];
                        case 6:
                            result = new _1.Audio(null, 0, attachment.audio.artist, attachment.audio.title);
                            return [3 /*break*/, 8];
                        case 7:
                            this.logger.log(attachment);
                            _b.label = 8;
                        case 8:
                            if (result || attachment.type === 'video')
                                return [2 /*return*/, result];
                            else
                                this.logger.error('Not got result for ' + attachment.type);
                            return [2 /*return*/];
                    }
                });
            });
        };
        VKApi.prototype.receive = function (key, server, ts) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                var result, user, chat, e_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, xrest_1.emit("GET https://" + server, {
                                    query: {
                                        act: 'a_check',
                                        key: key,
                                        ts: ts,
                                        wait: 25,
                                        mode: 66
                                    },
                                    timeout: 0
                                })];
                        case 1:
                            result = (_a.sent()).body;
                            if (result.failed) {
                                switch (result.failed) {
                                    case 1:
                                        ts = result.ts;
                                        process.nextTick(function () { return _this.receive(key, server, ts); });
                                        return [2 /*return*/];
                                    case 2:
                                    case 3:
                                        process.nextTick(function () { return _this.startReceiver(); });
                                        return [2 /*return*/];
                                    case 4:
                                    default:
                                        this.logger.err('Error on receive() call!'); //Should never been called
                                        process.nextTick(function () { return _this.startReceiver(); });
                                        return [2 /*return*/];
                                }
                            }
                            ts = result.ts;
                            user = null;
                            chat = null;
                            result.updates.forEach(function (update) { return __awaiter(_this, void 0, void 0, function () {
                                var that, type, _a, flags, user_id, from_id, timestamp, subject, text, attachments, chat_id, message_id, peer_id, local_id, count, extra, mask, _b, user_1, user_2, _c, user_3, chat_1, timing, event, user_4, chat_2, initiator, initiatorP, userP, chatP, _d, _e, _f, _g, realMessageNeeded, realMessage, forwarded, attachment, fwd, _h, _j, _k, _l, _m, lat, long, sender_id, isChat, user_5, message, _o, _p, _q, _r, e_4, _s, _t;
                                return __generator(this, function (_u) {
                                    switch (_u.label) {
                                        case 0:
                                            that = this;
                                            _u.label = 1;
                                        case 1:
                                            _u.trys.push([1, 38, , 39]);
                                            type = update.shift();
                                            _a = [null, null, null, null, null, null, null, null, null, null, null, null, null, null], flags = _a[0], user_id = _a[1], from_id = _a[2], timestamp = _a[3], subject = _a[4], text = _a[5], attachments = _a[6], chat_id = _a[7], message_id = _a[8], peer_id = _a[9], local_id = _a[10], count = _a[11], extra = _a[12], mask = _a[13];
                                            _b = type;
                                            switch (_b) {
                                                case 1: return [3 /*break*/, 2];
                                                case 2: return [3 /*break*/, 2];
                                                case 3: return [3 /*break*/, 2];
                                                case 7: return [3 /*break*/, 3];
                                                case 6: return [3 /*break*/, 3];
                                                case 80: return [3 /*break*/, 4];
                                                case 8: return [3 /*break*/, 5];
                                                case 9: return [3 /*break*/, 7];
                                                case 62: return [3 /*break*/, 9];
                                                case 4: return [3 /*break*/, 11];
                                            }
                                            return [3 /*break*/, 36];
                                        case 2:
                                            message_id = update[0], flags = update[1], peer_id = update[2];
                                            return [3 /*break*/, 37];
                                        case 3:
                                            peer_id = update[0], local_id = update[1];
                                            if (peer_id > 2e9)
                                                this.getChat(peer_id - 2e9);
                                            else
                                                this.getUser(peer_id);
                                            return [3 /*break*/, 37];
                                        case 4:
                                            count = update[0];
                                            return [3 /*break*/, 37];
                                        case 5:
                                            user_id = update[0], extra = update[1];
                                            user_id = -user_id;
                                            return [4 /*yield*/, this.getUser(user_id)];
                                        case 6:
                                            user_1 = _u.sent();
                                            this.emit('action', new _1.ActionEvent({
                                                user: user_1,
                                                chat: null,
                                                action: 'offline',
                                                data: extra
                                            }));
                                            return [3 /*break*/, 37];
                                        case 7:
                                            user_id = update[0], flags = update[1];
                                            user_id = -user_id;
                                            return [4 /*yield*/, this.getUser(user_id)];
                                        case 8:
                                            user_2 = _u.sent();
                                            this.emit('action', new _1.ActionEvent({
                                                user: user_2,
                                                chat: null,
                                                action: 'online',
                                                data: flags
                                            }));
                                            return [3 /*break*/, 37];
                                        case 9:
                                            user_id = update[0], chat_id = update[1];
                                            return [4 /*yield*/, Promise.all([
                                                    this.getUser(user_id),
                                                    this.getChat(chat_id),
                                                ])];
                                        case 10:
                                            _c = _u.sent(), user_3 = _c[0], chat_1 = _c[1];
                                            this.emit('action', new _1.ActionEvent({
                                                user: user_3,
                                                chat: chat_1,
                                                action: 'writing',
                                                data: null
                                            }));
                                            return [3 /*break*/, 37];
                                        case 11:
                                            message_id = update[0], flags = update[1], from_id = update[2], timestamp = update[3], subject = update[4], text = update[5], attachments = update[6];
                                            timing = new TimingData_js_1.default();
                                            if (!attachments.source_act)
                                                return [3 /*break*/, 21];
                                            event = void 0, initiator = void 0, initiatorP = void 0, userP = void 0, chatP = void 0;
                                            _d = attachments.source_act;
                                            switch (_d) {
                                                case 'chat_title_update': return [3 /*break*/, 12];
                                                case 'chat_invite_user': return [3 /*break*/, 15];
                                                case 'chat_kick_user': return [3 /*break*/, 17];
                                            }
                                            return [3 /*break*/, 19];
                                        case 12:
                                            _e = _1.TitleChangeEvent.bind;
                                            _g = { oldTitle: attachments.source_old_text, newTitle: attachments.source_text };
                                            return [4 /*yield*/, this.getUser(attachments.from)];
                                        case 13:
                                            _g.initiator = _u.sent();
                                            return [4 /*yield*/, this.getChat(from_id - 2e9)];
                                        case 14:
                                            event = new (_e.apply(_1.TitleChangeEvent, [void 0, (_g.chat = _u.sent(), _g)]))();
                                            this.emit('title', event);
                                            return [3 /*break*/, 20];
                                        case 15:
                                            if (attachments.from === attachments.source_mid)
                                                initiatorP = null;
                                            else
                                                initiatorP = this.getUser(attachments.from);
                                            userP = this.getUser(attachments.source_mid);
                                            chatP = this.getChat(from_id - 2e9);
                                            return [4 /*yield*/, Promise.all([userP, chatP, initiatorP])];
                                        case 16:
                                            _s = _u.sent(), user_4 = _s[0], chat_2 = _s[1], initiator = _s[2];
                                            event = new _1.JoinEvent({ user: user_4, chat: chat_2, initiator: initiator });
                                            this.emit('join', event);
                                            return [3 /*break*/, 20];
                                        case 17:
                                            initiatorP;
                                            if (attachments.from === attachments.source_mid)
                                                initiatorP = null;
                                            else
                                                initiatorP = this.getUser(attachments.from);
                                            userP = this.getUser(attachments.source_mid);
                                            chatP = this.getChat(from_id - 2e9);
                                            return [4 /*yield*/, Promise.all([userP, chatP, initiatorP])];
                                        case 18:
                                            _t = _u.sent(), user_4 = _t[0], chat_2 = _t[1], initiator = _t[2];
                                            event = new _1.LeaveEvent({ user: user_4, chat: chat_2, initiator: initiator });
                                            this.emit('leave', event);
                                            return [3 /*break*/, 20];
                                        case 19:
                                            this.logger.error('Unhandled event: ' + attachments.source_act, attachments);
                                            _u.label = 20;
                                        case 20: return [2 /*return*/];
                                        case 21:
                                            if ((flags & 2) == 2)
                                                return [2 /*return*/];
                                            realMessageNeeded = false;
                                            if (attachments.geo || attachments.fwd || attachments.attach1_type)
                                                realMessageNeeded = true;
                                            realMessage = void 0;
                                            forwarded = void 0;
                                            attachment = void 0;
                                            if (!realMessageNeeded)
                                                return [3 /*break*/, 23];
                                            timing.start('Get real msg');
                                            return [4 /*yield*/, this.execute('messages.getById', {
                                                    message_ids: message_id
                                                })];
                                        case 22:
                                            realMessage = (_u.sent()).items[0];
                                            timing.stop();
                                            _u.label = 23;
                                        case 23:
                                            if (!attachments.fwd)
                                                return [3 /*break*/, 28];
                                            timing.start('Parse forwarded');
                                            fwd = realMessage.fwd_messages[0];
                                            _h = _1.ForwardedMessage.bind;
                                            _k = {
                                                text: fwd.body
                                            };
                                            return [4 /*yield*/, this.getUser(fwd.user_id)];
                                        case 24:
                                            _k.sender = _u.sent();
                                            if (!fwd.attachments)
                                                return [3 /*break*/, 26];
                                            return [4 /*yield*/, this.parseAttachment(fwd.attachments[0])];
                                        case 25:
                                            _l = (_u.sent());
                                            return [3 /*break*/, 27];
                                        case 26:
                                            _l = undefined;
                                            _u.label = 27;
                                        case 27:
                                            forwarded = new (_h.apply(_1.ForwardedMessage, [void 0, (_k.attachment = _l,
                                                    _k)]))();
                                            timing.stop();
                                            _u.label = 28;
                                        case 28:
                                            if (!attachments.geo)
                                                return [3 /*break*/, 29];
                                            timing.start('GeoDB');
                                            _m = realMessage.geo.coordinates.split(' '), lat = _m[0], long = _m[1];
                                            attachment = new _1.Location(lat, long);
                                            timing.stop();
                                            return [3 /*break*/, 31];
                                        case 29:
                                            if (!(realMessage && realMessage.attachments))
                                                return [3 /*break*/, 31];
                                            timing.start('Real msg attachment');
                                            return [4 /*yield*/, this.parseAttachment(realMessage.attachments[0])];
                                        case 30:
                                            attachment = _u.sent();
                                            timing.stop();
                                            _u.label = 31;
                                        case 31:
                                            timing.start('Getting sender');
                                            sender_id = from_id > 2e9 ? attachments.from : from_id;
                                            isChat = from_id > 2e9;
                                            return [4 /*yield*/, this.getUser(sender_id)];
                                        case 32:
                                            user_5 = _u.sent();
                                            if (user_5.targetId === undefined) {
                                                this.logger.warn('NullUser');
                                                return [2 /*return*/];
                                            }
                                            timing.stop();
                                            _o = _1.MessageEvent.bind;
                                            _q = {
                                                api: this,
                                                attachment: attachment,
                                                text: decodeText(text),
                                                user: user_5
                                            };
                                            if (!isChat)
                                                return [3 /*break*/, 34];
                                            return [4 /*yield*/, this.getChat(from_id - 2e9)];
                                        case 33:
                                            _r = (_u.sent());
                                            return [3 /*break*/, 35];
                                        case 34:
                                            _r = undefined;
                                            _u.label = 35;
                                        case 35:
                                            message = new (_o.apply(_1.MessageEvent, [void 0, (_q.chat = _r,
                                                    _q.replyTo = forwarded,
                                                    _q.messageId = message_id,
                                                    _q.timing = timing,
                                                    _q)]))();
                                            message.user.messageId = message_id;
                                            if (isChat)
                                                message.chat.messageId = message_id;
                                            timing.start('Adapter <=> Xbot transfer');
                                            this.emit('message', message);
                                            return [3 /*break*/, 37];
                                        case 36:
                                            this.logger.err('Unhandled type: ' + type + ', update is ' + update);
                                            _u.label = 37;
                                        case 37: return [3 /*break*/, 39];
                                        case 38:
                                            e_4 = _u.sent();
                                            this.logger.error('Error while processing update:');
                                            this.logger.error(e_4);
                                            return [3 /*break*/, 39];
                                        case 39: return [2 /*return*/];
                                    }
                                });
                            }); });
                            setTimeout(function () { return _this.receive(key, server, ts); }, 1);
                            return [3 /*break*/, 3];
                        case 2:
                            e_3 = _a.sent();
                            this.logger.error(e_3);
                            setTimeout(function () { return _this.startReceiver(); }, 1);
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        VKApi.prototype.randomId = function () {
            return Math.round(Math.random() * 30000000);
        };
        VKApi.processText = function (text) {
            return text.replace(/ /g, SPACE_REPLACE);
        };
        //Implementing Api class methods
        VKApi.prototype.sendLocation = function (targetId, answer, caption, location, options) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.execute("messages.send", {
                                peer_id: targetId,
                                message: VKApi.processText(caption),
                                forward_messages: answer ? answer : "",
                                random_id: this.randomId(),
                                lat: location.lat,
                                long: location.long
                            })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        VKApi.prototype.sendText = function (targetId, answer, text, options) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.execute('messages.send', {
                                peer_id: targetId,
                                forward_messages: answer ? answer : "",
                                message: VKApi.processText(text),
                                random_id: this.randomId()
                            })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        VKApi.prototype.sendCommonAttachment = function (targetId, answer, caption, attachmentId, options) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.execute("messages.send", {
                                peer_id: targetId,
                                forward_messages: answer ? answer : "",
                                message: VKApi.processText(caption),
                                attachment: attachmentId,
                                random_id: this.randomId()
                            })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        VKApi.prototype.sendImageStream = function (targetId, answer, caption, image, options) {
            return __awaiter(this, void 0, void 0, function () {
                var server, res, res2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.execute('photos.getMessagesUploadServer', {})];
                        case 1:
                            server = _a.sent();
                            return [4 /*yield*/, xrest_1.emit("POST " + server.upload_url, {
                                    multipart: true,
                                    timeout: 50000,
                                    data: {
                                        photo: new multipart.FileStream(image.stream, image.name, image.size, 'binary', 'image/jpeg')
                                    }
                                })];
                        case 2:
                            res = _a.sent();
                            return [4 /*yield*/, this.execute('photos.saveMessagesPhoto', {
                                    photo: res.body.photo,
                                    server: res.body.server,
                                    hash: res.body.hash
                                })];
                        case 3:
                            res2 = _a.sent();
                            if (!res2[0])
                                console.log(res2, res.body);
                            return [4 /*yield*/, this.sendCommonAttachment(targetId, answer, VKApi.processText(caption), "photo" + res2[0].owner_id + "_" + res2[0].id, options)];
                        case 4:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        VKApi.prototype.sendFileStream = function (targetId, answer, caption, file, options) {
            return __awaiter(this, void 0, void 0, function () {
                var server, res, res2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.execute('docs.getUploadServer', {})];
                        case 1:
                            server = _a.sent();
                            return [4 /*yield*/, xrest_1.emit("POST " + server.upload_url, {
                                    multipart: true,
                                    timeout: 50000,
                                    data: {
                                        file: new multipart.FileStream(file.stream, file.name, file.size, 'binary', 'text/plain')
                                    }
                                })];
                        case 2:
                            res = _a.sent();
                            return [4 /*yield*/, this.execute('docs.save', {
                                    file: res.body.file,
                                    title: file.name
                                })];
                        case 3:
                            res2 = _a.sent();
                            return [4 /*yield*/, this.sendCommonAttachment(targetId, answer, VKApi.processText(caption), "doc" + res2[0].owner_id + "_" + res2[0].id, options)];
                        case 4:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        VKApi.prototype.sendVoiceStream = function (targetId, answer, caption, file, options) {
            return __awaiter(this, void 0, void 0, function () {
                var server, res, res2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.execute('docs.getUploadServer', {
                                type: 'audio_message'
                            })];
                        case 1:
                            server = _a.sent();
                            console.log(file.size, server);
                            return [4 /*yield*/, xrest_1.emit("POST " + server.upload_url, {
                                    multipart: true,
                                    timeout: 50000,
                                    data: {
                                        file: new multipart.FileStream(file.stream, '123.ogg', file.size, 'binary', 'text/plain')
                                    }
                                })];
                        case 2:
                            res = _a.sent();
                            return [4 /*yield*/, this.execute('docs.save', {
                                    file: res.body.file,
                                    title: ''
                                })];
                        case 3:
                            res2 = _a.sent();
                            return [4 /*yield*/, this.sendCommonAttachment(targetId, answer, VKApi.processText(caption), "doc" + res2[0].owner_id + "_" + res2[0].id, options)];
                        case 4:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        VKApi.prototype.sendAudioStream = function (targetId, answer, caption, audio, options) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    throw new Error('sendAudioStream() not implemented!');
                });
            });
        };
        VKApi.prototype.sendCustom = function (targetId, answer, caption, options) {
            return __awaiter(this, void 0, void 0, function () {
                var res1, res2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!options.ytVideo)
                                return [3 /*break*/, 4];
                            return [4 /*yield*/, this.execute('video.save', {
                                    link: options.ytVideo
                                })];
                        case 1:
                            res1 = _a.sent();
                            return [4 /*yield*/, xrest_1.emit('POST ' + res1.upload_url)];
                        case 2:
                            res2 = _a.sent();
                            return [4 /*yield*/, this.sendCommonAttachment(targetId, answer, VKApi.processText(caption), "video" + res1.owner_id + "_" + res1.video_id, options)];
                        case 3:
                            _a.sent();
                            _a.label = 4;
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        return VKApi;
    }(_1.Api));
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
});
//# sourceMappingURL=vk.js.map