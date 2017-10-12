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
import { createServer as createHttpsServer } from 'https';
import { METHODS, createServer as createHttpServer } from 'http';
import { createSecureServer as createHttps2Server } from 'http2';
import { parse as parseUrl } from 'url';
import { parse as parseQuerystring } from 'querystring';
import AJSON from '@meteor-it/ajson';
import Logger from '@meteor-it/logger';
import { arrayKVObject, encodeHtmlSpecials } from '@meteor-it/utils';
var URL_START_REPLACER = /^\/+/;
var PATH_INDEX_SYM = Symbol('XPress#Request.middlewareIndex');
var TEMP_URL = Symbol('XPress#Request.currentUrl');
var POSSIBLE_EVENTS = METHODS.concat(['ALL', 'WS']);
var MULTI_EVENTS = {
    'ALL': METHODS.filter(function (e) { return e != 'OPTIONS'; }).concat(['WS'])
};
var xpressLogger = new Logger('xpress');
var HttpError = /** @class */ (function (_super) {
    __extends(HttpError, _super);
    function HttpError(code, message) {
        var _this = _super.call(this, message) || this;
        _this.code = code;
        return _this;
    }
    return HttpError;
}(Error));
var routerIndex = 0;
var Router = /** @class */ (function () {
    function Router(name) {
        this.middlewares = [];
        this.routeIndexKey = Symbol('XPress#Request.middlewareIndex(Router#' + (routerIndex++) + ')');
        this.logger = new Logger(name);
    }
    Router.prototype.use = function (handler) {
        this.on('ALL /**?', handler);
    };
    //event===GET /, WS /*
    Router.prototype.on = function (eventString, handler) {
        var _this = this;
        var _a = eventString.split(' '), event = _a[0], path = _a[1], middlewares = _a.slice(2);
        if (middlewares.length !== 0)
            throw new Error('Middlewares work in progress! Remove thrid parameter from .on()');
        if (event.toUpperCase() !== event) {
            this.logger.warn('Upper case is preffered for event names! (Got: %s)', event);
            event = event.toUpperCase();
        }
        if (!~POSSIBLE_EVENTS.indexOf(event)) {
            throw new Error('Unknown event: ' + event + ', possible events are ' + POSSIBLE_EVENTS.join(', ') + '!');
        }
        var middleware = parsePath(path);
        var nhandler = handler;
        if (handler instanceof Router) {
            if (path.indexOf('**') !== -1)
                throw new Error('Can\'t attach router handle to double-star path! (Got: ' + path + ')');
            if (!path.endsWith('/*'))
                this.logger.warn('Seems like you forgot about /* at end of your router path. (Got: %s)', path);
            nhandler = function (req, res, next) {
                _this.logger.debug('Router handler url[before] = %s', req.originalUrl);
                var slicedUrl = '/' + req.originalUrl.split('/').slice(path.split('/').length - 1).join('/');
                _this.logger.debug('Router handler url[after] = %s', slicedUrl);
                return handler.handle(req, res, next, slicedUrl);
            };
        }
        if (nhandler.length !== 2 && nhandler.length !== 3)
            this.logger.warn('Possible invalid handler method! Possible methods: \n   (req,res,next)=>{...} \n   (req,res)=>{...}\nBut passed handler accepts %d arguments!', nhandler.length);
        if (MULTI_EVENTS[event])
            for (var _i = 0, _b = MULTI_EVENTS[event]; _i < _b.length; _i++) {
                var cEvent = _b[_i];
                middleware.handlers[cEvent] = nhandler;
            }
        else
            middleware.handlers[event] = nhandler;
        this.middlewares.push(middleware);
    };
    Router.prototype.handle = function (req, res, next, fakeUrl) {
        var _this = this;
        this.logger.debug('handle(%s %s)', req.method.toUpperCase(), fakeUrl || req.originalUrl);
        if (!req[this.routeIndexKey])
            req[this.routeIndexKey] = 0;
        if (req[this.routeIndexKey] > this.middlewares.length)
            next();
        var nextCb = function (data) {
            if (data)
                throw new Error('next() is called with data, it is unsupported currently! Use req object to save data for next routes');
            _this.logger.debug('next()');
            req[_this.routeIndexKey]++;
            _this.handle(req, res, next, fakeUrl);
        };
        var matched = null; // regex.match result
        var params = [];
        var found = null; // handle() function for method
        var currentMiddlewareIndex = req[this.routeIndexKey]; // Quick access
        while (!found) {
            this.logger.debug('Searching middleware... %d', currentMiddlewareIndex);
            if (!this.middlewares[currentMiddlewareIndex]) {
                // End of middleware list
                // currentMiddlewareIndex++;
                this.logger.debug('End of middleware list');
                break;
            }
            if (!this.middlewares[currentMiddlewareIndex].handlers[req.method]) {
                // No such method on this middleware
                currentMiddlewareIndex++;
                this.logger.debug('No method on middleware');
                continue;
            }
            if (!(matched = (fakeUrl || req.originalUrl).match(this.middlewares[currentMiddlewareIndex].regex))) {
                // Url regex doesn't match
                currentMiddlewareIndex++;
                this.logger.debug('URL doesn\'t matched: ', matched, fakeUrl || req.originalUrl, this.middlewares[currentMiddlewareIndex - 1].regex);
                continue;
            }
            // Found middleware
            found = this.middlewares[currentMiddlewareIndex].handlers[req.method];
            params = this.middlewares[currentMiddlewareIndex].params;
            // Dont match again, since we already have matches assigned to 'matched'
            //matched=(fakeUrl||req.originalUrl).match(this.middlewares[currentMiddlewareIndex]);
        }
        this.logger.debug('Index: %d, found: %s', currentMiddlewareIndex, !!found);
        req[this.routeIndexKey] = currentMiddlewareIndex; // Restore key
        if (found === null) {
            // Not found, exit from this router and go to next (or to XPress route handle)
            next();
            return;
        }
        // Found handler, gogogo!
        req.params = arrayKVObject(params, matched.slice(1));
        try {
            found(req, res, nextCb);
        }
        catch (e) {
            next(e);
        }
        //this.middlewares[req[this.routeIndexKey]].handle(req,res,nextCb);
    };
    return Router;
}());
export { Router };
var XPress = /** @class */ (function (_super) {
    __extends(XPress, _super);
    function XPress(name) {
        var _this = _super.call(this, name) || this;
        _this.listenListeners = [];
        _this.logger = new Logger(name);
        return _this;
    }
    XPress.prototype.addPossible = function (event) {
        POSSIBLE_EVENTS.push(event.toUpperCase());
    };
    XPress.prototype.parseReqUrl = function (req) {
        // Set
        var parsed = parseUrl(req.url);
        req.originalUrl = req.url;
        req.app = this;
        req.body = req.cookie = undefined;
        req.path = parsed.pathname;
        req.secure = 'https' == req.protocol;
        req.query = parseQuerystring(req.querystring = parsed.query);
    };
    XPress.prototype.populateReqHeader = function (req) {
        // Express.JS methods
        req.set = function (key, value) {
            req.setHeader(key, value);
            //return req;
        };
        req.get = function (key) {
            return req.getHeader(key);
            //return req;
        };
        // reqRes.removeHeader; This is a part of original api
    };
    XPress.prototype.populateRequest = function (req) {
        this.parseReqUrl(req);
        req.secure = req.protocol === 'https';
    };
    XPress.prototype.populateResHeader = function (res) {
        var _this = this;
        res.header = {};
        res.__getHeader = res.getHeader;
        res.__setHeader = res.setHeader;
        res.__removeHeader = res.removeHeader;
        res.set = function (key, value) {
            _this.logger.debug('Set header %s to %s', key, value);
            res.__setHeader(key, value);
        };
        res.get = function (key) {
            _this.logger.debug('Get value of header %s', key);
            return res.__getHeader(key);
        };
        res.getHeader = function (key) {
            return res.get(key);
        };
        res.setHeader = function (key, value) {
            res.set(key, value);
        };
        res.removeHeader = function (key) {
            res.__removeHeader(key);
        };
    };
    XPress.prototype.populateResponse = function (res) {
        this.populateResHeader(res);
        res.__writeHead = res.writeHead;
        res.__end = res.end;
        res.sent = false;
        // TODO: Use primary closure
        res.writeHead = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return res.__writeHead.apply(res, args);
        };
        res.end = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            //res.writeHead(res.statusCode?res.statusCode:200,res.header);
            return res.__end.apply(res, args);
        };
        res.status = function (code) {
            res.statusCode = code;
        };
        res.redirect = function (url) {
            if (res.sent)
                throw new Error('Data is already sent!');
            res.sent = true;
            res.writeHead(307, {
                Location: url
            });
            res.end('307 Redirect to ' + url);
        };
        res.send = function (body) {
            if (res.sent)
                throw new Error('Data is already sent!');
            res.sent = true;
            res.writeHead(res.statusCode ? res.statusCode : 200, res.headers);
            if (typeof body === 'object')
                body = AJSON.stringify(body);
            res.end(body);
        };
    };
    XPress.prototype.httpHandler = function (req, res) {
        var _this = this;
        // HTTP/HTTPS request handler
        // Populate request with data
        this.populateRequest(req);
        this.populateResponse(res);
        // Execute Router handler, the first in the handlers chain
        try {
            this.handle(req, res, function (err) {
                // Next here = all routes ends, so thats = 404
                _this.logger.warn('404 Page not found at ' + req[TEMP_URL]);
                // Allow only HttpError to be thrown
                if (!(err instanceof HttpError))
                    err = new HttpError(404, 'Page not found: ' + encodeHtmlSpecials(req[TEMP_URL]));
                res.end(developerErrorPageHandler(err.code, err.message, err.stack));
            }, req.originalUrl);
        }
        catch (e) {
            res.end(developerErrorPageHandler(e.code, e.message, e.stack));
        }
    };
    XPress.prototype.http2Handler = function (req, res) {
        var _this = this;
        // HTTPS2 request handler
        // Populate request with data
        this.populateRequest(req);
        this.populateResponse(res);
        // Execute Router handler, the first in the handlers chain
        try {
            this.handle(req, res, function (err) {
                // Next here = all routes ends, so thats = 404
                _this.logger.warn('404 Page not found at ' + req[TEMP_URL]);
                // Allow only HttpError to be thrown
                if (!(err instanceof HttpError))
                    err = new HttpError(404, 'Page not found: ' + encodeHtmlSpecials(req[TEMP_URL]));
                res.end(developerErrorPageHandler(err.code, err.message, err.stack));
            }, req.originalUrl);
        }
        catch (e) {
            res.end(developerErrorPageHandler(e.code, e.message, e.stack));
        }
    };
    XPress.prototype.onListen = function (func) {
        this.listenListeners.push(func);
    };
    XPress.prototype.listenHttp = function (host, port, silent) {
        var _this = this;
        if (host === void 0) { host = '0.0.0.0'; }
        if (silent === void 0) { silent = false; }
        var httpServer = createHttpServer(this.httpHandler.bind(this));
        this.logger.debug('Before listening, executing listeners (to add support providers)...', this.listenListeners.length);
        this.listenListeners.forEach(function (listener) { listener(httpServer, _this); });
        this.logger.debug('Done adding %d support providers, listening...', this.listenListeners.length);
        return new Promise(function (res, rej) {
            httpServer.listen(port, host, function () {
                if (!silent)
                    _this.logger.log('Listening (http) on %s:%d...', host, port);
                res(httpServer);
            });
        });
    };
    XPress.prototype.listenHttp2 = function () {
        throw new Error('browsers has no support for insecure http2, so listenHttp2() is deprecated');
    };
    XPress.prototype.listenHttps = function (host, port, certs, silent) {
        var _this = this;
        if (host === void 0) { host = '0.0.0.0'; }
        if (silent === void 0) { silent = false; }
        var httpsServer = createHttpsServer(certs, this.httpHandler.bind(this));
        this.logger.debug('Before listening, executing listeners (to add support providers)...');
        this.listenListeners.forEach(function (listener) { listener(httpsServer, _this); });
        this.logger.debug('Done adding %d support providers, listening...', this.listenListeners.length);
        return new Promise(function (res, rej) {
            httpsServer.listen(port, host, function () {
                if (!silent)
                    _this.logger.log('Listening (https) on %s:%d...', host, port);
                res(httpsServer);
            });
        });
    };
    XPress.prototype.listenHttps2 = function (host, port, certs, silent) {
        var _this = this;
        if (host === void 0) { host = '0.0.0.0'; }
        if (silent === void 0) { silent = false; }
        var https2Server = createHttps2Server(__assign({}, certs, { allowHTTP1: true }), this.http2Handler.bind(this));
        this.logger.debug('Before listening, executing listeners (to add support providers)...');
        this.listenListeners.forEach(function (listener) { listener(https2Server, _this); });
        this.logger.debug('Done adding %d support providers, listening...', this.listenListeners.length);
        return new Promise(function (res, rej) {
            https2Server.listen(port, host, function () {
                if (!silent)
                    _this.logger.log('Listening (https2) on %s:%d...', host, port);
                res(https2Server);
            });
        });
    };
    return XPress;
}(Router));
export default XPress;
function parsePath(path) {
    // We can use path-to-regexp, but why, if it is soo big module with a lot of dependencies?
    var result = {
        regex: null,
        params: [],
        handlers: {}
    };
    path = path.replace(URL_START_REPLACER, '');
    var starCount = 0;
    result.regex = new RegExp('^/' + path.split('/').map(function (part) {
        if (part.indexOf(':') !== -1 && part.length >= 1) {
            result.params.push(part.substr(part.indexOf(':') + 1));
            return part.substr(0, part.indexOf(':')) + '([^/]+)';
        }
        if (part === '*') {
            if (starCount === 0) {
                result.params.push('star');
                starCount++;
            }
            else {
                result.params.push('star_' + ++starCount);
            }
            return '([^\/]+)';
        }
        if (part === '**') {
            if (starCount === 0) {
                result.params.push('star');
                starCount++;
            }
            else {
                result.params.push('star_' + ++starCount);
            }
            return '(.+)';
        }
        if (part === '*?') {
            if (starCount === 0) {
                result.params.push('star');
                starCount++;
            }
            else {
                result.params.push('star_' + ++starCount);
            }
            return '([^\/]*)';
        }
        if (part === '**?') {
            if (starCount === 0) {
                result.params.push('star');
                starCount++;
            }
            else {
                result.params.push('star_' + ++starCount);
            }
            return '(.*)';
        }
        return part;
    }).join('/') + '$', '');
    xpressLogger.debug('NEW PATH REGEX: '.blue + result.regex);
    return result;
}
export function developerErrorPageHandler(title, desc, stack) {
    if (stack === void 0) { stack = undefined; }
    // Developer friendly
    if (title)
        title = encodeHtmlSpecials(title).replace(/\n/g, '<br>');
    if (desc)
        desc = encodeHtmlSpecials(desc).replace(/\n/g, '<br>');
    if (stack)
        stack = encodeHtmlSpecials(stack).replace(/\n/g, '<br>');
    return "<!DOCTYPE html><html><head><title>" + title + "</title></head><body><h1>" + desc + "</h1><hr>" + (stack ? "<code>" + stack + "</code>" : '') + "<hr><h2>uFramework xPress</h2></body></html>";
}
export function userErrorPageHandler(hello, whatHappened, sorry, post) {
    // User friendly
    if (hello)
        hello = encodeHtmlSpecials(hello.replace(/\n/g, '<br>'));
    if (whatHappened)
        whatHappened = encodeHtmlSpecials(whatHappened.replace(/\n/g, '<br>'));
    if (sorry)
        sorry = encodeHtmlSpecials(sorry.replace(/\n/g, '<br>'));
    if (post)
        post = encodeHtmlSpecials(post.replace(/\n/g, '<br>'));
    return "<html><head></head><body style='font-family:Arial,sans-serif;font-size:22px;color:#CCC;background:#222;padding:40px;'>" + hello + "<br/><br/><span style='color:#FC0;font-weight:600;'>" + whatHappened + "</span><br/><br/>" + sorry + "<br/><br/><span style='font-size: 14px;'>" + post + "</span></body></html>";
}
//# sourceMappingURL=index.js.map