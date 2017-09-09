var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
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
})(["require", "exports", "@meteor-it/logger", "./multipart", "events", "http", "http", "https", "url", "querystring", "zlib", "iconv", "./multipart"], function (require, exports) {
    "use strict";
    function __export(m) {
        for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
    }
    var logger_1 = require("@meteor-it/logger");
    var multipart = require("./multipart");
    var events_1 = require("events");
    var http = require("http");
    var http_1 = require("http");
    var https = require("https");
    var url_1 = require("url");
    var querystring_1 = require("querystring");
    var zlib = require("zlib");
    var iconv_1 = require("iconv");
    __export(require("./multipart"));
    var POSSIBLE_EVENTS = http_1.METHODS.slice();
    var POSSIBLE_MIDDLEWARES = ['STREAM'];
    var USER_AGENT = 'Meteor-IT XRest';
    // TODO: Http2 
    var decoders = {
        gzip: function (buf) {
            return new Promise(function (res, rej) {
                zlib.gunzip(buf, function (err, result) { return err ? rej(err) : res(result); });
            });
        },
        deflate: function (buf, callback) {
            return new Promise(function (res, rej) {
                zlib.inflate(buf, function (err, result) { return err ? rej(err) : res(result); });
            });
        }
    };
    var parsers = {
        json: function (text, cb) {
            try {
                cb(null, JSON.parse(text));
            }
            catch (e) {
                cb(null, text);
            }
        }
    };
    var Request = (function (_super) {
        __extends(Request, _super);
        function Request(url, options) {
            var _this = _super.call(this) || this;
            _this.prepare(url, options);
            return _this;
        }
        Request.prototype.prepare = function (url, options) {
            logger.debug('prepare(%s)', url);
            if (url.indexOf('undefined') + 1) {
                logger.warn('undefined found in request url! Stack for reference:');
                logger.warn(new Error('reference stack').stack);
            }
            this.url = url_1.parse(url);
            this.options = options;
            this.headers = __assign({ 'Accept': '*/*', 'User-Agent': USER_AGENT, 'Host': this.url.host, 'Accept-Encoding': 'gzip, deflate' }, options.headers);
            // set port and method defaults
            if (!this.url.port)
                this.url.port = (this.url.protocol === 'https:') ? '443' : '80';
            if (!this.options.method)
                this.options.method = (this.options.data) ? 'POST' : 'GET';
            if (typeof this.options.followRedirects === 'undefined')
                this.options.followRedirects = true;
            if (this.options.timeout === undefined)
                this.options.timeout = 12000;
            if (!this.options.parser)
                this.options.parser = parsers.json;
            // stringify query given in options of not given in URL
            if (this.options.query) {
                if (typeof this.options.query === 'object')
                    this.url.query = querystring_1.stringify(this.options.query);
                else
                    this.url.query = this.options.query;
            }
            this.applyAuth();
            if (this.options.multipart) {
                this.headers['Content-Type'] = "multipart/form-data; boundary=" + multipart.DEFAULT_BOUNDARY;
                var multipartSize = multipart.sizeOf(this.options.data, multipart.DEFAULT_BOUNDARY);
                if (!isNaN(multipartSize))
                    this.headers['Content-Length'] = multipartSize;
                else
                    throw new Error('Cannot get Content-Length!');
            }
            else {
                if (typeof this.options.data === 'object' && !Buffer.isBuffer(this.options.data)) {
                    this.options.data = querystring_1.stringify(this.options.data);
                    this.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                    this.headers['Content-Length'] = this.options.data.length;
                }
                if (typeof this.options.data === 'string') {
                    var buffer = new Buffer(this.options.data, this.options.encoding || 'utf8');
                    this.options.data = buffer;
                    this.headers['Content-Length'] = buffer.length;
                }
                if (!this.options.data) {
                    this.headers['Content-Length'] = 0;
                }
            }
            var proto = (this.url.protocol === 'https:') ? https : http;
            this.request = proto.request({
                host: this.url.hostname,
                port: this.url.port,
                path: this.fullPath(),
                method: this.options.method,
                headers: this.headers,
                rejectUnauthorized: this.options.rejectUnauthorized,
                agent: this.options.agent
            });
            this.makeRequest();
        };
        Request.isRedirect = function (response) {
            return ([301, 302, 303, 307].includes(response.statusCode));
        };
        Request.prototype.fullPath = function () {
            var path = this.url.pathname || '/';
            if (this.url.hash)
                path += this.url.hash;
            if (this.url.query)
                path += "?" + this.url.query;
            return path;
        };
        Request.prototype.applyAuth = function () {
            var authParts;
            if (this.url.auth) {
                authParts = this.url.auth.split(':');
                this.options.username = authParts[0];
                this.options.password = authParts[1];
            }
            if (this.options.username && this.options.password !== undefined) {
                var b = new Buffer([this.options.username, this.options.password].join(':'));
                this.headers['Authorization'] = "Basic " + b.toString('base64');
            }
            else if (this.options.accessToken) {
                this.headers['Authorization'] = "Bearer " + this.options.accessToken;
            }
        };
        Request.prototype.responseHandler = function (response) {
            var _this = this;
            if (Request.isRedirect(response) && this.options.followRedirects) {
                try {
                    // 303 should redirect and retrieve content with the GET method
                    // http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.3.4
                    if (response.statusCode === 303) {
                        this.url = url_1.parse(url_1.resolve(this.url.href, response.headers['location']));
                        this.options.method = 'GET';
                        delete this.options.data;
                        this.reRetry();
                    }
                    else {
                        this.url = url_1.parse(url_1.resolve(this.url.href, response.headers['location']));
                        this.reRetry();
                    }
                }
                catch (err) {
                    err.message = "Failed to follow redirect: " + err.message;
                    this.fireError(err, response);
                }
            }
            else {
                var body_1 = '';
                // When using browserify, response.setEncoding is not defined
                if (typeof response.setEncoding === 'function')
                    response.setEncoding('binary');
                response.on('data', function (chunk) {
                    body_1 += chunk;
                });
                response.on('end', function () { return __awaiter(_this, void 0, void 0, function () {
                    var _this = this;
                    var e_1;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                response.rawEncoded = body_1;
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 4, , 5]);
                                return [4 /*yield*/, Request.decode(new Buffer(body_1, 'binary'), response)];
                            case 2:
                                body_1 = _a.sent();
                                response.raw = body_1;
                                return [4 /*yield*/, Request.iconv(body_1, response)];
                            case 3:
                                body_1 = _a.sent();
                                this.encode(body_1, response, function (err, body) {
                                    if (err) {
                                        _this.fireError(err, response);
                                    }
                                    else {
                                        _this.fireSuccess(body, response);
                                    }
                                });
                                return [3 /*break*/, 5];
                            case 4:
                                e_1 = _a.sent();
                                this.fireError(e_1, response);
                                return [3 /*break*/, 5];
                            case 5: return [2 /*return*/];
                        }
                    });
                }); });
            }
        };
        Request.decode = function (body, response) {
            return __awaiter(this, void 0, void 0, function () {
                var decoder;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            decoder = response.headers['content-encoding'];
                            if (!(decoder in decoders))
                                return [3 /*break*/, 2];
                            return [4 /*yield*/, decoders[decoder].call(response, body)];
                        case 1: return [2 /*return*/, _a.sent()];
                        case 2: return [2 /*return*/, body];
                    }
                });
            });
        };
        Request.iconv = function (body, response) {
            var charset = response.headers['content-type'];
            if (charset) {
                charset = /\bcharset=(.+)(?:;|$)/i.exec(charset);
                if (charset) {
                    charset = charset[1].trim().toUpperCase();
                    if (charset !== 'UTF-8') {
                        try {
                            return iconv_1.default.decode(body, charset);
                        }
                        catch (e) {
                            return Promise.resolve(body);
                        }
                    }
                }
            }
            return body;
        };
        Request.prototype.encode = function (body, response, callback) {
            if (this.options.decoding === 'buffer') {
                callback(null, body);
            }
            else {
                body = body.toString(this.options.decoding);
                if (this.options.parser) {
                    this.options.parser.call(response, body, callback);
                }
                else {
                    callback(null, body);
                }
            }
        };
        Request.prototype.fireError = function (err, response) {
            this.fireCancelTimeout();
            this.emit('error', err, response);
            this.emit('complete', err, response);
        };
        Request.prototype.fireCancelTimeout = function () {
            if (this.options.timeout) {
                clearTimeout(this.options.timeoutFn);
            }
        };
        Request.prototype.fireTimeout = function (err) {
            this.emit('timeout', err);
            this.aborted = true;
            this.timedout = true;
            this.request.abort();
        };
        Request.prototype.fireSuccess = function (body, response) {
            if (parseInt(response.statusCode, 10) >= 400) {
                this.emit('fail', body, response);
            }
            else {
                this.emit('success', body, response);
            }
            this.emit(response.statusCode.toString().replace(/\d{2}$/, 'XX'), body, response);
            this.emit(response.statusCode.toString(), body, response);
            this.emit('complete', body, response);
        };
        Request.prototype.makeRequest = function () {
            var _this = this;
            var timeoutMs = this.options.timeout;
            if (timeoutMs) {
                this.options.timeoutFn = setTimeout(function () {
                    _this.fireTimeout(timeoutMs);
                }, timeoutMs);
            }
            this.request.on('response', function (response) {
                _this.fireCancelTimeout();
                _this.emit('response', response);
                _this.responseHandler(response);
            }).on('error', function (err) {
                _this.fireCancelTimeout();
                if (!_this.aborted) {
                    _this.fireError(err, null);
                }
            });
        };
        Request.prototype.reRetry = function () {
            this.request.removeAllListeners().on('error', function () {
            });
            if (this.request.finished) {
                this.request.abort();
            }
            this.prepare(this.url.href, this.options); // reusing request object to handle recursive calls and remember listeners
            this.run();
        };
        Request.prototype.run = function () {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!this.options.multipart)
                                return [3 /*break*/, 2];
                            return [4 /*yield*/, multipart.write(this.request, this.options.data, function () {
                                    _this.request.end();
                                })];
                        case 1:
                            _a.sent();
                            return [3 /*break*/, 3];
                        case 2:
                            if (this.options.data) {
                                this.request.write(this.options.data, this.options.encoding || 'utf8');
                            }
                            this.request.end();
                            _a.label = 3;
                        case 3: return [2 /*return*/, this];
                    }
                });
            });
        };
        Request.prototype.abort = function (err) {
            var _this = this;
            if (err) {
                if (typeof err === 'string') {
                    err = new Error(err);
                }
                else if (!(err instanceof Error)) {
                    err = new Error('AbortError');
                }
                err.type = 'abort';
            }
            else {
                err = null;
            }
            this.request.on('close', function () {
                if (err) {
                    _this.fireError(err, null);
                }
                else {
                    _this.emit('complete', null, null);
                }
            });
            this.aborted = true;
            this.request.abort();
            this.emit('abort', err);
            return this;
        };
        Request.prototype.retry = function (timeout) {
            timeout = parseInt(timeout, 10);
            var fn = this.reRetry.bind(this);
            if (!isFinite(timeout) || timeout <= 0) {
                process.nextTick(fn, timeout);
            }
            else {
                setTimeout(fn, timeout);
            }
            return this;
        };
        return Request;
    }(events_1.EventEmitter));
    var logger = new logger_1.default('xrest');
    function emit(eventString, options) {
        if (options === void 0) { options = {}; }
        var _a = eventString.split(' '), event = _a[0], path = _a[1], middlewares = _a.slice(2);
        var middleFunctions = [];
        for (var _i = 0, middlewares_1 = middlewares; _i < middlewares_1.length; _i++) {
            var middleware = middlewares_1[_i];
            if (middleware.toUpperCase() !== middleware) {
                logger.warn('Upper case is preffered for middleware names! (Got: %s)', event);
                middleware = middleware.toUpperCase();
            }
            if (!~POSSIBLE_MIDDLEWARES.indexOf(middleware))
                throw new Error('Unknown middleware: ' + middleware);
            middleFunctions.push(middleware);
        }
        if (event.toUpperCase() !== event) {
            logger.warn('Upper case is preffered for event names! (Got: %s)', event);
            event = event.toUpperCase();
        }
        if (!~POSSIBLE_EVENTS.indexOf(event)) {
            throw new Error('Unknown event: ' + event + ', possible events are ' + POSSIBLE_EVENTS.join(', ') + '!');
        }
        options.method = event;
        var request = new Request(path, options);
        return new Promise(function (res, rej) {
            request.run();
            request.on('timeout', function (ms) {
                rej(new Error('Timeout: ' + ms));
            });
            request.on('complete', function (result, response) {
                if (result instanceof Error) {
                    rej(result);
                    return;
                }
                response.body = result;
                res(response);
            });
        });
    }
    exports.emit = emit;
    var XRest = (function () {
        function XRest(url, defaultOptions) {
            logger.debug('new XRest(%s)', url);
            this.baseUrl = url;
            this.defaultOptions = defaultOptions;
        }
        XRest.prototype.emit = function (eventString, options) {
            var _a = eventString.split(' '), event = _a[0], path = _a[1], middlewares = _a.slice(2);
            var opts = {};
            Object.assign(opts, this.defaultOptions, options);
            path = url_1.resolve(this.baseUrl, path);
            return emit([event, path].concat(middlewares).join(' '), opts);
        };
        return XRest;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = XRest;
});
//# sourceMappingURL=index.js.map