var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
import { Api, User, Chat, MessageEvent, Gender, Location, Image, File } from "../";
import * as TelegramBot from 'node-telegram-bot-api';
var TGApi = /** @class */ (function (_super) {
    __extends(TGApi, _super);
    function TGApi() {
        var _this = _super.call(this, 'TGAPI') || this;
        _this.logged = false;
        _this.photoCache = new Map();
        return _this;
    }
    TGApi.prototype.auth = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var bot;
            return __generator(this, function (_a) {
                bot = new TelegramBot(token, {
                    polling: true
                });
                this.bot = bot;
                this.logger.log('Logged in');
                this.logged = true;
                this.startReceiver();
                return [2 /*return*/];
            });
        });
    };
    TGApi.prototype.parseAttachment = function (type, obj) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _a = type;
                        switch (_a) {
                            case 'photo': return [3 /*break*/, 1];
                            case 'document': return [3 /*break*/, 4];
                            case 'location': return [3 /*break*/, 7];
                        }
                        return [3 /*break*/, 8];
                    case 1:
                        _c = (_b = Image).fromUrl;
                        return [4 /*yield*/, this.bot.getFileLink(obj[obj.length - 1].file_id)];
                    case 2: return [4 /*yield*/, _c.apply(_b, [_f.sent()])];
                    case 3: return [2 /*return*/, _f.sent()];
                    case 4:
                        _e = (_d = File).fromUrl;
                        return [4 /*yield*/, this.bot.getFileLink(obj.file_id)];
                    case 5: return [4 /*yield*/, _e.apply(_d, [_f.sent(), obj.file_name])];
                    case 6: return [2 /*return*/, _f.sent()];
                    case 7: return [2 /*return*/, new Location(obj.latitude, obj.longitude)];
                    case 8:
                        this.logger.error('Unknown type: ' + type, obj);
                        return [2 /*return*/, null];
                }
            });
        });
    };
    TGApi.prototype.startReceiver = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.bot.on('message', function (msg) { return __awaiter(_this, void 0, void 0, function () {
                    var chatId, attachment, attachmentType, _i, _a, type, text, user, chat, isChat, message;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                chatId = msg.chat.id;
                                attachment = null;
                                for (_i = 0, _a = 'document,photo,location'.split(','); _i < _a.length; _i++) {
                                    type = _a[_i];
                                    if (msg[type]) {
                                        attachment = msg[type];
                                        attachmentType = type;
                                    }
                                }
                                if (!(attachment !== null)) return [3 /*break*/, 2];
                                return [4 /*yield*/, this.parseAttachment(attachmentType, attachment)];
                            case 1:
                                attachment = _b.sent();
                                _b.label = 2;
                            case 2:
                                text = msg.caption || msg.text || '';
                                return [4 /*yield*/, this.getUserFromApiData(msg.from)];
                            case 3:
                                user = _b.sent();
                                chat = null;
                                if (!'group,supergroup,channel'.includes(msg.chat.type)) return [3 /*break*/, 5];
                                return [4 /*yield*/, this.getChatFromApiData(msg.chat)];
                            case 4:
                                chat = _b.sent();
                                _b.label = 5;
                            case 5:
                                isChat = !!chat;
                                message = new MessageEvent({
                                    api: this,
                                    attachment: attachment,
                                    text: text,
                                    user: user,
                                    chat: isChat ? chat : undefined,
                                    replyTo: undefined,
                                    messageId: msg.message_id
                                });
                                message.user.messageId = msg.message_id;
                                if (message.chat)
                                    message.chat.messageId = msg.message_id;
                                this.emit('message', message);
                                return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/];
            });
        });
    };
    TGApi.prototype.uGetUser = function (uid) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error('WIP');
            });
        });
    };
    TGApi.prototype.uGetChat = function (cid) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error('WIP');
            });
        });
    };
    TGApi.prototype.getUserFromApiData = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var photoFile, photoD;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        photoFile = this.photoCache.get('TG:PHOTO:' + data.id);
                        if (!!photoFile) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.bot.getUserProfilePhotos(data.id)];
                    case 1:
                        photoD = _a.sent();
                        photoD = photoD.photos[photoD.photos.length - 1];
                        photoD = photoD[photoD.length - 1];
                        return [4 /*yield*/, this.bot.getFileLink(photoD.file_id)];
                    case 2:
                        photoFile = _a.sent();
                        this.photoCache.set('TG:PHOTO:' + data.id, photoFile);
                        _a.label = 3;
                    case 3: return [2 /*return*/, new User({
                            messageId: null,
                            api: this,
                            uid: 'TG.' + data.id,
                            targetId: data.id,
                            nickName: data.username || data.first_name,
                            firstName: data.first_name || data.username,
                            lastName: data.last_name || '',
                            gender: Gender.MAN,
                            photoUrl: photoFile,
                            profileUrl: 'https://telegram.me/' + data.username
                        })];
                }
            });
        });
    };
    TGApi.prototype.getChatFromApiData = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, new Chat({
                        messageId: null,
                        api: this,
                        cid: 'TGC.' + data.id,
                        targetId: data.id,
                        title: data.title,
                        users: [],
                        admins: [],
                        photoUrl: 'http://www.myiconfinder.com/uploads/iconsets/256-256-b381526610eb3ed95c7fdf75f1ec54d5.png'
                    })];
            });
        });
    };
    TGApi.prototype.sendLocation = function (targetId, answer, caption, location, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    TGApi.prototype.sendText = function (targetId, answer, text, options) {
        return __awaiter(this, void 0, void 0, function () {
            var opts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        opts = {};
                        if (options.keyboard) {
                            opts.reply_markup = {
                                inline_keyboard: options.keyboard.map(function (row) { return row.map(function (btn) { return ({ text: btn[0], callback_data: btn[1] }); }); })
                            };
                        }
                        return [4 /*yield*/, this.bot.sendMessage(targetId, text, __assign({ reply_to_message_id: answer }, options.keyboard))];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    TGApi.prototype.sendImageStream = function (targetId, answer, caption, image, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        image.stream.path = 'aaaaa.jpeg';
                        return [4 /*yield*/, this.bot.sendPhoto(targetId, image.stream, {
                                reply_to_message_id: answer,
                                caption: caption
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    TGApi.prototype.sendFileStream = function (targetId, answer, caption, file, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    TGApi.prototype.sendAudioStream = function (targetId, answer, caption, audio, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    TGApi.prototype.sendCustom = function (targetId, answer, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    return TGApi;
}(Api));
export default TGApi;
//# sourceMappingURL=tg.js.map