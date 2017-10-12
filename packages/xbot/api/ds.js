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
import { Api, User, Chat, MessageEvent, Gender } from "../";
import { sleep } from '@meteor-it/utils';
import { Client } from 'discord.js';
var SPACE_REPLACE = String.fromCharCode(8194);
var DSApi = /** @class */ (function (_super) {
    __extends(DSApi, _super);
    function DSApi() {
        var _this = _super.call(this, 'DSAPI') || this;
        _this.logged = false;
        _this.photoCache = new Map();
        return _this;
    }
    DSApi.prototype.auth = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var client;
            return __generator(this, function (_a) {
                client = new Client();
                client.login(token);
                this.client = client;
                this.logger.log('Logged in');
                this.logged = true;
                this.startReceiver();
                return [2 /*return*/];
            });
        });
    };
    DSApi.prototype.parseAttachment = function (type, obj) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    DSApi.prototype.startReceiver = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.client.on('message', function (message) {
                    var user = _this.getUserFromApiData(message.author);
                    var chat = message.channel;
                    if (message.guild)
                        chat = _this.getChatFromApiData(chat, message.guild);
                    var isChat = !!chat;
                    var msgEvent = new MessageEvent({
                        api: _this,
                        text: message.content,
                        user: user,
                        chat: isChat ? chat : undefined,
                        replyTo: undefined,
                        messageId: message.id
                    });
                    msgEvent.user.messageId = message.id;
                    if (msgEvent.chat)
                        msgEvent.chat.messageId = message.id;
                    _this.emit('message', msgEvent);
                });
                return [2 /*return*/];
            });
        });
    };
    DSApi.prototype.uGetUser = function (uid) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error('WIP');
            });
        });
    };
    DSApi.prototype.uGetChat = function (cid) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new Error('WIP');
            });
        });
    };
    DSApi.prototype.getUserFromApiData = function (data) {
        return new User({
            messageId: null,
            api: this,
            uid: 'DS.' + data.id,
            targetId: data,
            nickName: data.username,
            firstName: data.username,
            lastName: '',
            gender: Gender.MAN,
            photoUrl: data.displayAvatarURL,
            profileUrl: 'netu ego, hы'
        });
    };
    DSApi.prototype.getChatFromApiData = function (data, guild) {
        var _this = this;
        return new Chat({
            messageId: null,
            api: this,
            cid: 'DSC.' + data.id,
            targetId: data,
            title: data.topic || data.name,
            users: guild.members.array().map(function (member) { return _this.getUserFromApiData(member); }),
            admins: [],
            photoUrl: guild.iconURL
        });
    };
    DSApi.prototype.sendLocation = function (targetId, answer, caption, location, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    DSApi.prototype.limitTextString = function (text) {
        var strings, currentString;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    strings = text.split(' \n');
                    currentString = '';
                    _a.label = 1;
                case 1:
                    if (!true) return [3 /*break*/, 7];
                    if (!(strings.length === 0)) return [3 /*break*/, 4];
                    if (!(currentString !== '')) return [3 /*break*/, 3];
                    return [4 /*yield*/, currentString];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/];
                case 4:
                    if (!(currentString.length + strings[0].length >= 2000)) return [3 /*break*/, 6];
                    return [4 /*yield*/, currentString];
                case 5:
                    _a.sent();
                    currentString = '';
                    _a.label = 6;
                case 6:
                    currentString += strings.shift() + '\n';
                    return [3 /*break*/, 1];
                case 7: return [2 /*return*/];
            }
        });
    };
    DSApi.prototype.sendText = function (targetId, answer, text, options) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, textPart;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _i = 0, _a = this.limitTextString(SPACE_REPLACE + '\n' + text);
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        textPart = _a[_i];
                        return [4 /*yield*/, targetId.send(textPart)];
                    case 2:
                        _b.sent();
                        return [4 /*yield*/, sleep(500)];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 1];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    DSApi.prototype.sendImageStream = function (targetId, answer, caption, image, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    DSApi.prototype.sendFileStream = function (targetId, answer, caption, file, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    DSApi.prototype.sendAudioStream = function (targetId, answer, caption, audio, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    DSApi.prototype.sendCustom = function (targetId, answer, options) {
        return __awaiter(this, void 0, void 0, function () { return __generator(this, function (_a) {
            return [2 /*return*/];
        }); });
    };
    return DSApi;
}(Api));
export default DSApi;
//# sourceMappingURL=ds.js.map