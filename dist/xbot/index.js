var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
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
})(["require", "exports", "@meteor-it/logger", "./EventEmitter", "@meteor-it/fs", "@meteor-it/xrest", "@meteor-it/utils", "./TimingData.js"], function (require, exports) {
    "use strict";
    var logger_1 = require("@meteor-it/logger");
    var EventEmitter_1 = require("./EventEmitter");
    var fs_1 = require("@meteor-it/fs");
    var xrest_1 = require("@meteor-it/xrest");
    var utils_1 = require("@meteor-it/utils");
    var TimingData_js_1 = require("./TimingData.js");
    var POSSIBLE_ACTIONS = ['writing'];
    var XBot = (function (_super) {
        __extends(XBot, _super);
        function XBot(name) {
            var _this = _super.call(this) || this;
            _this.apiList = [];
            _this.name = name;
            _this.logger = new logger_1.default(name);
            return _this;
        }
        XBot.prototype.attachApi = function (api) {
            var _this = this;
            if (!api.logged)
                throw new Error('You must call api.auth before adding them!');
            api.on('message', function (msg) { return _this.onMessage(msg, api); });
            api.on('title', function (msg) { return _this.onTitle(msg, api); });
            api.on('photo', function (msg) { return _this.onPhoto(msg, api); });
            api.on('join', function (msg) { return _this.onJoin(msg, api); });
            api.on('leave', function (msg) { return _this.onLeave(msg, api); });
            api.on('action', function (msg) { return _this.onAction(msg, api); });
            this.apiList.push(api);
        };
        XBot.prototype.onMessage = function (message, sourceApi) {
            var timing = message.timing;
            timing.stop();
            message.sourceApi = sourceApi;
            timing.start('Xbot extension');
            message.attachXBot(this);
            timing.stop();
            timing.start('Console log');
            var inChat = message.chat ? (" [" + message.chat.title.red + "]") : '';
            var attachment = message.attachment ? ("A".magenta) : ' ';
            var reply = message.replyTo ? ("R".magenta) : ' ';
            var lastName = message.user.lastName ? " " + message.user.lastName.blue : '';
            this.logger.log("<" + message.user.firstName.blue + lastName + inChat + ">[" + attachment + reply + "]\n" + message.text);
            timing.stop();
            timing.start('XBot <=> Ayzek transfer');
            this.emit('message', message);
        };
        XBot.prototype.onLeave = function (leave, sourceApi) {
            leave.sourceApi = sourceApi;
            leave.attachXBot(this);
            var initiator = leave.initiator ? " (by " + leave.initiator.firstName.blue + " " + leave.initiator.lastName.blue + ")" : '';
            var lastName = leave.user.lastName ? " " + leave.user.lastName.blue : '';
            this.logger.log("" + leave.user.firstName.blue + lastName + " {red}leaved{/red} " + leave.chat.title.red + initiator);
            this.emit('leave', leave);
        };
        XBot.prototype.onJoin = function (join, sourceApi) {
            join.sourceApi = sourceApi;
            join.attachXBot(this);
            var initiator = join.initiator ? " (by " + join.initiator.firstName.blue + " " + join.initiator.lastName.blue + ")" : '';
            var lastName = join.user.lastName ? " " + join.user.lastName.blue : '';
            this.logger.log("" + join.user.firstName.blue + lastName + " {green}joined{/green} " + join.chat.title.red + initiator);
            this.emit('join', join);
        };
        XBot.prototype.onAction = function (action, sourceApi) {
            action.sourceApi = sourceApi;
            action.attachXBot(this);
            var inChat = action.chat ? (" [" + action.chat.title.red + "]") : '';
            var lastName = action.user.lastName ? " " + action.user.lastName.blue : '';
            this.logger.log("" + action.user.firstName.blue + lastName + inChat + " - " + action.action.yellow);
            this.emit('action', action);
        };
        XBot.prototype.onPhoto = function (photo, sourceApi) {
            photo.sourceApi = sourceApi;
            photo.attachXBot(this);
            var lastName = photo.initiator.lastName ? " " + photo.initiator.lastName.blue : '';
            this.logger.log("Changed photo in " + photo.chat.title.red + " -> " + photo.newPhotoUrl + " by " + photo.initiator.firstName + lastName);
            this.emit('photo', photo);
        };
        XBot.prototype.onTitle = function (title, sourceApi) {
            title.sourceApi = sourceApi;
            title.attachXBot(this);
            var lastName = title.initiator.lastName ? " " + title.initiator.lastName.blue : '';
            this.logger.log(title.oldTitle.red + ' -> ' + title.newTitle.green + ' by ' + title.initiator.firstName + lastName);
            this.emit('title', title);
        };
        XBot.prototype.uGetUser = function (uid) {
            return __awaiter(this, void 0, void 0, function () {
                var found, i, e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            found = null;
                            i = 0;
                            _a.label = 1;
                        case 1:
                            if (!(i < this.apiList.length))
                                return [3 /*break*/, 6];
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.apiList[i].uGetUser(uid)];
                        case 3:
                            found = _a.sent();
                            if (found)
                                return [3 /*break*/, 6];
                            return [3 /*break*/, 5];
                        case 4:
                            e_1 = _a.sent();
                            return [3 /*break*/, 5];
                        case 5:
                            i++;
                            return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, found];
                    }
                });
            });
        };
        XBot.prototype.uGetChat = function (cid) {
            return __awaiter(this, void 0, void 0, function () {
                var found, i, e_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            found = null;
                            i = 0;
                            _a.label = 1;
                        case 1:
                            if (!(i < this.apiList.length))
                                return [3 /*break*/, 6];
                            _a.label = 2;
                        case 2:
                            _a.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, this.apiList[i].uGetChat(cid)];
                        case 3:
                            found = _a.sent();
                            if (found)
                                return [3 /*break*/, 6];
                            return [3 /*break*/, 5];
                        case 4:
                            e_2 = _a.sent();
                            return [3 /*break*/, 5];
                        case 5:
                            i++;
                            return [3 /*break*/, 1];
                        case 6: return [2 /*return*/, found];
                    }
                });
            });
        };
        XBot.prototype.onWaitNext = function () {
            this.logger.warn("onWaitNext should be implemented in extender class!");
        };
        return XBot;
    }(EventEmitter_1.default));
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = XBot;
    var NotImplementedInApiError = (function (_super) {
        __extends(NotImplementedInApiError, _super);
        function NotImplementedInApiError(method) {
            return _super.call(this, 'Not implemented in api: ' + method + '()') || this;
        }
        return NotImplementedInApiError;
    }(Error));
    var Api = (function (_super) {
        __extends(Api, _super);
        function Api(name) {
            var _this = _super.call(this) || this;
            _this.logged = false;
            _this.name = name;
            _this.logger = new logger_1.default(name);
            return _this;
        }
        Api.prototype.auth = function () {
            var params = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                params[_i] = arguments[_i];
            }
            throw new NotImplementedInApiError('auth');
        };
        Api.prototype.uGetUser = function (uid) {
            throw new NotImplementedInApiError('uGetUser');
        };
        Api.prototype.uGetChat = function (cid) {
            throw new NotImplementedInApiError('uGetChat');
        };
        Api.prototype.sendLocation = function (targetId, answer, caption, location, options) {
            throw new NotImplementedInApiError('sendLocation');
        };
        Api.prototype.sendText = function (targetId, answer, text, options) {
            throw new NotImplementedInApiError('sendText');
        };
        Api.prototype.sendImageStream = function (targetId, answer, caption, image, options) {
            throw new NotImplementedInApiError('sendImageStream');
        };
        Api.prototype.sendFileStream = function (targetId, answer, caption, file, options) {
            throw new NotImplementedInApiError('sendFileStream');
        };
        Api.prototype.sendAudioStream = function (targetId, answer, caption, audio, options) {
            throw new NotImplementedInApiError('sendAudioStream');
        };
        Api.prototype.sendCustom = function (targetId, answer, caption, options) {
            throw new NotImplementedInApiError('sendCustom');
        };
        return Api;
    }(EventEmitter_1.default));
    exports.Api = Api;
    var Location = (function () {
        function Location(lat, long) {
            this.lat = lat;
            this.long = long;
        }
        return Location;
    }());
    exports.Location = Location;
    var BaseFile = (function () {
        function BaseFile(stream, size, name) {
            if (isNaN(size))
                throw new Error('Wrong file size! ' + size);
            this.stream = stream;
            this.name = name;
            this.size = size;
        }
        return BaseFile;
    }());
    var File = (function (_super) {
        __extends(File, _super);
        function File(stream, size, name, mime) {
            if (mime === void 0) { mime = 'text/plain'; }
            var _this = _super.call(this, stream, size, name) || this;
            _this.mime = mime;
            return _this;
        }
        File.fromBuffer = function (buffer, name, mime) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, new File(utils_1.createReadStream(buffer), buffer.length, name, mime)];
                });
            });
        };
        File.fromUrl = function (url, name, mime) {
            return __awaiter(this, void 0, void 0, function () {
                var res, size;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, xrest_1.emit("GET " + url + " STREAM")];
                        case 1:
                            res = _a.sent();
                            size = +res.headers['content-length'];
                            return [2 /*return*/, new File(res, size, name, mime)];
                    }
                });
            });
        };
        File.fromFilePath = function (path, name, mime) {
            return __awaiter(this, void 0, void 0, function () {
                var size;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.isFile(path)];
                        case 1:
                            if (!(_a.sent()))
                                throw new Error('This is not a file! ' + path);
                            return [4 /*yield*/, fs_1.stat(path)];
                        case 2:
                            size = (_a.sent()).size;
                            return [2 /*return*/, new File(fs_1.getReadStream(path), size, name, mime)];
                    }
                });
            });
        };
        return File;
    }(BaseFile));
    exports.File = File;
    // Some services looks at extensions, so extension can be changed runtime in adapter
    var Image = (function (_super) {
        __extends(Image, _super);
        function Image(stream, size) {
            return _super.call(this, stream, size, 'image.jpg') || this;
        }
        Image.fromUrl = function (url) {
            return __awaiter(this, void 0, void 0, function () {
                var res, size;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, xrest_1.emit("GET " + url)];
                        case 1:
                            res = _a.sent();
                            size = parseInt(res.headers['content-length'], 10);
                            return [2 /*return*/, new Image(utils_1.createReadStream(res.raw), size)];
                    }
                });
            });
        };
        Image.fromFilePath = function (path) {
            return __awaiter(this, void 0, void 0, function () {
                var size;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.stat(path)];
                        case 1:
                            size = (_a.sent()).size;
                            return [2 /*return*/, new Image(fs_1.getReadStream(path), size)];
                    }
                });
            });
        };
        Image.fromCanvas = function (canvas) {
            return __awaiter(this, void 0, void 0, function () {
                var fullStream, buffer;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            fullStream = canvas.jpegStream({
                                bufsize: 4096,
                                quality: 100,
                                progressive: true
                            });
                            return [4 /*yield*/, utils_1.readStream(fullStream)];
                        case 1:
                            buffer = _a.sent();
                            return [2 /*return*/, new Image(utils_1.createReadStream(buffer), buffer.length)];
                    }
                });
            });
        };
        return Image;
    }(BaseFile));
    exports.Image = Image;
    var Audio = (function (_super) {
        __extends(Audio, _super);
        function Audio(stream, size, artist, title) {
            return _super.call(this, stream, size, artist + " " + title + ".mp3") || this;
        }
        Audio.fromUrl = function (url, artist, title) {
            return __awaiter(this, void 0, void 0, function () {
                var res, size;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, xrest_1.emit("GET " + url + " STREAM")];
                        case 1:
                            res = _a.sent();
                            size = res.headers['content-length'];
                            return [2 /*return*/, new Audio(res, size, artist, title)];
                    }
                });
            });
        };
        Audio.fromFilePath = function (path, artist, title) {
            return __awaiter(this, void 0, void 0, function () {
                var size;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, fs_1.stat(path)];
                        case 1:
                            size = (_a.sent()).size;
                            return [2 /*return*/, new Audio(fs_1.getReadStream(path), size, artist, title)];
                    }
                });
            });
        };
        return Audio;
    }(BaseFile));
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
    var ForwardedMessage = (function () {
        function ForwardedMessage(_a) {
            var text = _a.text, sender = _a.sender, attachment = _a.attachment;
            this.text = text;
            this.sender = sender;
            this.attachment = attachment;
        }
        return ForwardedMessage;
    }());
    exports.ForwardedMessage = ForwardedMessage;
    var Conversation = (function () {
        function Conversation(api, targetId, messageId) {
            //assertAllIsDefined(api,targetId);
            this.api = api;
            this.targetId = targetId;
            this.messageId = messageId;
        }
        Conversation.prototype.sendLocation = function (answer, caption, location, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(this, void 0, void 0, function () {
                var inChat, attachment, reply;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(location instanceof Location))
                                throw new Error('"location" is not a instance of Location!');
                            if (this.xbot) {
                                inChat = (this instanceof Chat) ? (" [" + this.title.red + "]") : '';
                                attachment = true ? ("A".magenta) : ' ';
                                reply = answer ? ("R".magenta) : ' ';
                                this.xbot.logger.log("<" + 'Ayzek'.blue + " " + 'Azimov'.blue + inChat + ">[" + attachment + reply + "]" + ("\n" + caption || ''));
                            }
                            return [4 /*yield*/, this.api.sendLocation(this.targetId, answer, caption, location, options)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        Conversation.prototype.sendText = function (answer, text, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(this, void 0, void 0, function () {
                var inChat, attachment, reply;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (this.xbot) {
                                inChat = (this instanceof Chat) ? (" [" + this.title.red + "]") : '';
                                attachment = false ? ("A".magenta) : ' ';
                                reply = answer ? ("R".magenta) : ' ';
                                this.xbot.logger.log("<" + 'Ayzek'.blue + " " + 'Azimov'.blue + inChat + ">[" + attachment + reply + "]\n" + text.green);
                            }
                            return [4 /*yield*/, this.api.sendText(this.targetId, answer ? this.messageId : undefined, text, options)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        Conversation.prototype.sendImage = function (answer, caption, image, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(this, void 0, void 0, function () {
                var inChat, attachment, reply;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(image instanceof Image))
                                throw new Error('"image" is not a instance of Image!');
                            if (this.xbot) {
                                inChat = (this instanceof Chat) ? (" [" + this.title.red + "]") : '';
                                attachment = true ? ("A".magenta) : ' ';
                                reply = answer ? ("R".magenta) : ' ';
                                this.xbot.logger.log("<" + 'Ayzek'.blue + " " + 'Azimov'.blue + inChat + ">[" + attachment + reply + "]" + ("\n" + caption || ''));
                            }
                            return [4 /*yield*/, this.api.sendImageStream(this.targetId, answer ? this.messageId : undefined, caption, image, options)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        Conversation.prototype.sendFile = function (answer, caption, file, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(this, void 0, void 0, function () {
                var inChat, attachment, reply;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(file instanceof File))
                                throw new Error('"file" is not a instance of File!');
                            if (this.xbot) {
                                inChat = (this instanceof Chat) ? (" [" + this.title.red + "]") : '';
                                attachment = true ? ("A".magenta) : ' ';
                                reply = answer ? ("R".magenta) : ' ';
                                this.xbot.logger.log("<" + 'Ayzek'.blue + " " + 'Azimov'.blue + inChat + ">[" + attachment + reply + "]" + ("\n" + caption || ''));
                            }
                            return [4 /*yield*/, this.api.sendFileStream(this.targetId, answer ? this.messageId : undefined, caption, file, options)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        Conversation.prototype.sendAudio = function (answer, caption, audio, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(this, void 0, void 0, function () {
                var inChat, attachment, reply;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(audio instanceof Audio))
                                throw new Error('"audio" is not a instance of Audio!');
                            if (this.xbot) {
                                inChat = (this instanceof Chat) ? (" [" + this.title.red + "]") : '';
                                attachment = true ? ("A".magenta) : ' ';
                                reply = answer ? ("R".magenta) : ' ';
                                this.xbot.logger.log("<" + 'Ayzek'.blue + " " + 'Azimov'.blue + inChat + ">[" + attachment + reply + "]" + ("\n" + caption || ''));
                            }
                            return [4 /*yield*/, this.api.sendAudioStream(this.targetId, answer ? this.messageId : undefined, caption, audio, options)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        Conversation.prototype.sendVoice = function (answer, caption, file, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(this, void 0, void 0, function () {
                var inChat, attachment, reply;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(file instanceof File))
                                throw new Error('"file" is not a instance of File!');
                            if (this.xbot) {
                                inChat = (this instanceof Chat) ? (" [" + this.title.red + "]") : '';
                                attachment = true ? ("A".magenta) : ' ';
                                reply = answer ? ("R".magenta) : ' ';
                                this.xbot.logger.log("<" + 'Ayzek'.blue + " " + 'Azimov'.blue + inChat + ">[" + attachment + ("\n" + reply || '') + "]");
                            }
                            return [4 /*yield*/, this.api.sendVoiceStream(this.targetId, answer ? this.messageId : undefined, caption, file, options)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        Conversation.prototype.sendCustom = function (answer, caption, options) {
            if (options === void 0) { options = {}; }
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.api.sendCustom(this.targetId, answer ? this.messageId : undefined, caption, options)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        return Conversation;
    }());
    var User = (function (_super) {
        __extends(User, _super);
        function User(_a) {
            var api = _a.api, uid = _a.uid, targetId = _a.targetId, _b = _a.nickName, nickName = _b === void 0 ? null : _b, firstName = _a.firstName, lastName = _a.lastName, gender = _a.gender, photoUrl = _a.photoUrl, _c = _a.role, role = _c === void 0 ? Role.USER : _c, profileUrl = _a.profileUrl, messageId = _a.messageId;
            var _this = 
            //assertAllIsDefined(api,uid,targetId,firstName,lastName,gender,photoUrl,config,state,profileUrl);
            _super.call(this, api, targetId, messageId) || this;
            _this.isUser = true;
            _this.isChat = false;
            _this.uid = uid;
            _this.nickName = nickName;
            _this.firstName = firstName;
            _this.lastName = lastName;
            _this.gender = gender;
            _this.photoUrl = photoUrl;
            _this.profileUrl = profileUrl;
            return _this;
        }
        User.prototype.getPhotoImage = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, Image.fromUrl(this.photoUrl)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        User.prototype.getName = function () {
            if (this.nickName)
                return this.nickName;
            else
                return this.firstName;
        };
        User.prototype.getFullName = function () {
            var name = '';
            if (this.firstName)
                name += this.firstName + ' ';
            if (this.lastName)
                name += this.lastName + ' ';
            if (this.nickName)
                name += "(" + this.nickName + ") ";
            return name.trim();
        };
        User.prototype.waitNew = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return (_a = this.xbot).onWaitNext.apply(_a, [this].concat(args));
            var _a;
        };
        return User;
    }(Conversation));
    exports.User = User;
    var Chat = (function (_super) {
        __extends(Chat, _super);
        function Chat(_a) {
            var api = _a.api, cid = _a.cid, targetId = _a.targetId, title = _a.title, users = _a.users, admins = _a.admins, messageId = _a.messageId, photoUrl = _a.photoUrl;
            var _this = 
            //assertAllIsDefined(api,cid,targetId,title,users,admins,photoUrl,config,state);
            _super.call(this, api, targetId, messageId) || this;
            _this.isUser = false;
            _this.isChat = true;
            _this.cid = cid;
            _this.users = users;
            _this.title = title;
            _this.admins = admins;
            _this.photoUrl = photoUrl;
            return _this;
        }
        Chat.prototype.isAdmin = function (user) {
            return ~this.admins.indexOf(user) || user.role === Role.CREATOR;
        };
        Chat.prototype.getPhotoImage = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, Image.fromUrl(this.photoUrl)];
                        case 1: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        Chat.prototype.waitNew = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return (_a = this.xbot).onWaitNext.apply(_a, [this].concat(args));
            var _a;
        };
        return Chat;
    }(Conversation));
    exports.Chat = Chat;
    var MessageEvent = (function (_super) {
        __extends(MessageEvent, _super);
        function MessageEvent(data) {
            var _this = 
            //assertAllIsDefined(api,mid,attachment,text,user,chat);
            _super.call(this, data.api, data.chat ? data.chat.targetId : data.user.targetId, data.messageId) || this;
            _this.isUser = true;
            _this.attachment = data.attachment;
            _this.text = data.text;
            _this.user = data.user;
            _this.chat = data.chat;
            _this.timing = data.timing || new TimingData_js_1.default();
            _this.replyTo = data.replyTo;
            return _this;
        }
        Object.defineProperty(MessageEvent.prototype, "isChat", {
            get: function () {
                return !!this.chat;
            },
            enumerable: true,
            configurable: true
        });
        MessageEvent.prototype.attachXBot = function (xbot) {
            this.xbot = xbot;
            if (this.chat)
                this.chat.xbot = xbot;
            this.user.xbot = xbot;
        };
        return MessageEvent;
    }(Conversation));
    exports.MessageEvent = MessageEvent;
    var JoinEvent = (function () {
        function JoinEvent(data) {
            //assertAllIsDefined(user,chat);
            this.user = data.user;
            this.chat = data.chat;
            this.initiator = data.initiator;
            this.timing = data.timing || new TimingData_js_1.default();
        }
        JoinEvent.prototype.attachXBot = function (xbot) {
            this.xbot = xbot;
            this.chat.xbot = xbot;
            this.user.xbot = xbot;
            if (this.initiator)
                this.initiator.xbot = xbot;
        };
        return JoinEvent;
    }());
    exports.JoinEvent = JoinEvent;
    var ActionEvent = (function () {
        function ActionEvent(data) {
            //assertAllIsDefined(user);
            this.action = data.action;
            this.user = data.user;
            this.chat = data.chat;
            this.data = data.data;
            this.timing = data.timing || new TimingData_js_1.default();
        }
        ActionEvent.prototype.attachXBot = function (xbot) {
            this.xbot = xbot;
            if (this.chat)
                this.chat.xbot = xbot;
            this.user.xbot = xbot;
        };
        return ActionEvent;
    }());
    exports.ActionEvent = ActionEvent;
    var LeaveEvent = (function () {
        function LeaveEvent(data) {
            this.user = data.user;
            this.chat = data.chat;
            this.initiator = data.initiator;
            this.timing = data.timing || new TimingData_js_1.default();
        }
        LeaveEvent.prototype.attachXBot = function (xbot) {
            this.xbot = xbot;
            this.chat.xbot = xbot;
            this.user.xbot = xbot;
        };
        return LeaveEvent;
    }());
    exports.LeaveEvent = LeaveEvent;
    var TitleChangeEvent = (function () {
        function TitleChangeEvent(data) {
            this.oldTitle = data.oldTitle;
            this.newTitle = data.newTitle;
            this.initiator = data.initiator;
            this.chat = data.chat;
            this.timing = data.timing || new TimingData_js_1.default();
        }
        TitleChangeEvent.prototype.attachXBot = function (xbot) {
            this.xbot = xbot;
            this.chat.xbot = xbot;
            this.initiator.xbot = xbot;
        };
        return TitleChangeEvent;
    }());
    exports.TitleChangeEvent = TitleChangeEvent;
    var PhotoChangeEvent = (function () {
        function PhotoChangeEvent(data) {
            //assertAllIsDefined(newPhotoUrl,initiator,chat);
            this.newPhotoUrl = data.newPhotoUrl;
            this.initiator = data.initiator;
            this.chat = data.chat;
            this.timing = data.timing || new TimingData_js_1.default();
        }
        PhotoChangeEvent.prototype.attachXBot = function (xbot) {
            this.xbot = xbot;
            this.chat.xbot = xbot;
            this.initiator.xbot = xbot;
        };
        return PhotoChangeEvent;
    }());
    exports.PhotoChangeEvent = PhotoChangeEvent;
});
//# sourceMappingURL=index.js.map