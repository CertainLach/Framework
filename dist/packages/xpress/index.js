"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
const https_1 = require("https");
const http_1 = require("http");
const http2_1 = require("http2");
const url_1 = require("url");
const querystring_1 = require("querystring");
const ajson_1 = require("@meteor-it/ajson");
const logger_1 = require("@meteor-it/logger");
const utils_1 = require("@meteor-it/utils");
const URL_START_REPLACER = /^\/+/;
const PATH_INDEX_SYM = Symbol('XPress#Request.middlewareIndex');
const TEMP_URL = Symbol('XPress#Request.currentUrl');
const POSSIBLE_EVENTS = [...http_1.METHODS, 'ALL', 'WS'];
const MULTI_EVENTS = {
    'ALL': [...http_1.METHODS.filter(e => e != 'OPTIONS'), 'WS']
};
let xpressLogger = new logger_1.default('xpress');
class HttpError extends Error {
    constructor(code, message) {
        super(message);
        this.code = code;
    }
}
let routerIndex = 0;
class Router {
    constructor(name) {
        this.middlewares = [];
        this.routeIndexKey = Symbol('XPress#Request.middlewareIndex(Router#' + (routerIndex++) + ')');
        this.logger = new logger_1.default(name);
    }
    use(handler) {
        this.on('ALL /**?', handler);
    }
    on(eventString, handler) {
        let [event, path, ...middlewares] = eventString.split(' ');
        if (middlewares.length !== 0)
            throw new Error('Middlewares work in progress! Remove thrid parameter from .on()');
        if (event.toUpperCase() !== event) {
            this.logger.warn('Upper case is preffered for event names! (Got: %s)', event);
            event = event.toUpperCase();
        }
        if (!~POSSIBLE_EVENTS.indexOf(event)) {
            throw new Error('Unknown event: ' + event + ', possible events are ' + POSSIBLE_EVENTS.join(', ') + '!');
        }
        let middleware = parsePath(path);
        let nhandler = handler;
        if (handler instanceof Router) {
            if (path.indexOf('**') !== -1)
                throw new Error('Can\'t attach router handle to double-star path! (Got: ' + path + ')');
            if (!path.endsWith('/*'))
                this.logger.warn('Seems like you forgot about /* at end of your router path. (Got: %s)', path);
            nhandler = (req, res, next) => {
                this.logger.debug('Router handler url[before] = %s', req.originalUrl);
                let slicedUrl = '/' + req.originalUrl.split('/').slice(path.split('/').length - 1).join('/');
                this.logger.debug('Router handler url[after] = %s', slicedUrl);
                return handler.handle(req, res, next, slicedUrl);
            };
        }
        if (nhandler.length !== 2 && nhandler.length !== 3)
            this.logger.warn('Possible invalid handler method! Possible methods: \n   (req,res,next)=>{...} \n   (req,res)=>{...}\nBut passed handler accepts %d arguments!', nhandler.length);
        if (MULTI_EVENTS[event])
            for (let cEvent of MULTI_EVENTS[event])
                middleware.handlers[cEvent] = nhandler;
        else
            middleware.handlers[event] = nhandler;
        this.middlewares.push(middleware);
    }
    handle(req, res, next, fakeUrl) {
        this.logger.debug('handle(%s %s)', req.method.toUpperCase(), fakeUrl || req.originalUrl);
        if (!req[this.routeIndexKey])
            req[this.routeIndexKey] = 0;
        if (req[this.routeIndexKey] > this.middlewares.length)
            next();
        let nextCb = (data) => {
            if (data)
                throw new Error('next() is called with data, it is unsupported currently! Use req object to save data for next routes');
            this.logger.debug('next()');
            req[this.routeIndexKey]++;
            this.handle(req, res, next, fakeUrl);
        };
        let matched = null;
        let params = [];
        let found = null;
        let currentMiddlewareIndex = req[this.routeIndexKey];
        while (!found) {
            this.logger.debug('Searching middleware... %d', currentMiddlewareIndex);
            if (!this.middlewares[currentMiddlewareIndex]) {
                this.logger.debug('End of middleware list');
                break;
            }
            if (!this.middlewares[currentMiddlewareIndex].handlers[req.method]) {
                currentMiddlewareIndex++;
                this.logger.debug('No method on middleware');
                continue;
            }
            if (!(matched = (fakeUrl || req.originalUrl).match(this.middlewares[currentMiddlewareIndex].regex))) {
                currentMiddlewareIndex++;
                this.logger.debug('URL doesn\'t matched: ', matched, fakeUrl || req.originalUrl, this.middlewares[currentMiddlewareIndex - 1].regex);
                continue;
            }
            found = this.middlewares[currentMiddlewareIndex].handlers[req.method];
            params = this.middlewares[currentMiddlewareIndex].params;
        }
        this.logger.debug('Index: %d, found: %s', currentMiddlewareIndex, !!found);
        req[this.routeIndexKey] = currentMiddlewareIndex;
        if (found === null) {
            next();
            return;
        }
        req.params = utils_1.arrayKVObject(params, matched.slice(1));
        try {
            found(req, res, nextCb);
        }
        catch (e) {
            next(e);
        }
    }
}
exports.Router = Router;
class XPress extends Router {
    constructor(name) {
        super(name);
        this.listenListeners = [];
        this.logger = new logger_1.default(name);
    }
    addPossible(event) {
        POSSIBLE_EVENTS.push(event.toUpperCase());
    }
    parseReqUrl(req) {
        let parsed = url_1.parse(req.url);
        req.originalUrl = req.url;
        req.app = this;
        req.body = req.cookie = undefined;
        req.path = parsed.pathname;
        req.secure = 'https' == req.protocol;
        req.query = querystring_1.parse(req.querystring = parsed.query);
    }
    populateReqHeader(req) {
        req.set = (key, value) => {
            req.setHeader(key, value);
        };
        req.get = (key) => {
            return req.getHeader(key);
        };
    }
    populateRequest(req) {
        this.parseReqUrl(req);
        req.secure = req.protocol === 'https';
    }
    populateResHeader(res) {
        res.header = {};
        res.__getHeader = res.getHeader;
        res.__setHeader = res.setHeader;
        res.__removeHeader = res.removeHeader;
        res.set = (key, value) => {
            this.logger.debug('Set header %s to %s', key, value);
            res.__setHeader(key, value);
        };
        res.get = (key) => {
            this.logger.debug('Get value of header %s', key);
            return res.__getHeader(key);
        };
        res.getHeader = (key) => {
            return res.get(key);
        };
        res.setHeader = (key, value) => {
            res.set(key, value);
        };
        res.removeHeader = (key) => {
            res.__removeHeader(key);
        };
    }
    populateResponse(res) {
        this.populateResHeader(res);
        res.__writeHead = res.writeHead;
        res.__end = res.end;
        res.sent = false;
        res.writeHead = (...args) => {
            return res.__writeHead(...args);
        };
        res.end = (...args) => {
            return res.__end(...args);
        };
        res.status = (code) => {
            res.statusCode = code;
        };
        res.redirect = (url) => {
            if (res.sent)
                throw new Error('Data is already sent!');
            res.sent = true;
            res.writeHead(307, {
                Location: url
            });
            res.end('307 Redirect to ' + url);
        };
        res.send = (body) => {
            if (res.sent)
                throw new Error('Data is already sent!');
            res.sent = true;
            res.writeHead(res.statusCode ? res.statusCode : 200, res.headers);
            if (typeof body === 'object')
                body = ajson_1.default.stringify(body);
            res.end(body);
        };
    }
    httpHandler(req, res) {
        this.populateRequest(req);
        this.populateResponse(res);
        try {
            this.handle(req, res, err => {
                this.logger.warn('404 Page not found at ' + req[TEMP_URL]);
                if (!(err instanceof HttpError))
                    err = new HttpError(404, 'Page not found: ' + utils_1.encodeHtmlSpecials(req[TEMP_URL]));
                res.end(developerErrorPageHandler(err.code, err.message, err.stack));
            }, req.originalUrl);
        }
        catch (e) {
            res.end(developerErrorPageHandler(e.code, e.message, e.stack));
        }
    }
    http2Handler(req, res) {
        this.populateRequest(req);
        this.populateResponse(res);
        try {
            this.handle(req, res, err => {
                this.logger.warn('404 Page not found at ' + req[TEMP_URL]);
                if (!(err instanceof HttpError))
                    err = new HttpError(404, 'Page not found: ' + utils_1.encodeHtmlSpecials(req[TEMP_URL]));
                res.end(developerErrorPageHandler(err.code, err.message, err.stack));
            }, req.originalUrl);
        }
        catch (e) {
            res.end(developerErrorPageHandler(e.code, e.message, e.stack));
        }
    }
    onListen(func) {
        this.listenListeners.push(func);
    }
    listenHttp(host = '0.0.0.0', port, silent = false) {
        let httpServer = http_1.createServer(this.httpHandler.bind(this));
        this.logger.log('Before listening, executing listeners (to add support providers)...', this.listenListeners.length);
        this.listenListeners.forEach(listener => { listener(httpServer, this); });
        this.logger.log('Done adding %d support providers, listening...', this.listenListeners.length);
        return new Promise((res, rej) => {
            httpServer.listen(port, host, () => {
                if (!silent)
                    this.logger.log('Listening (http) on %s:%d...', host, port);
                res(httpServer);
            });
        });
    }
    listenHttp2() {
        throw new Error('browsers has no support for insecure http2, so listenHttp2() is deprecated');
    }
    listenHttps(host = '0.0.0.0', port, certs, silent = false) {
        let httpsServer = https_1.createServer(certs, this.httpHandler.bind(this));
        this.logger.log('Before listening, executing listeners (to add support providers)...');
        this.listenListeners.forEach(listener => { listener(httpsServer, this); });
        this.logger.log('Done adding %d support providers, listening...', this.listenListeners.length);
        return new Promise((res, rej) => {
            httpsServer.listen(port, host, () => {
                if (!silent)
                    this.logger.log('Listening (https) on %s:%d...', host, port);
                res();
            });
        });
    }
    listenHttps2(host = '0.0.0.0', port, certs, silent = false) {
        let https2Server = http2_1.createSecureServer(__assign({}, certs, { allowHTTP1: true }), this.http2Handler.bind(this));
        this.logger.log('Before listening, executing listeners (to add support providers)...');
        this.listenListeners.forEach(listener => { listener(https2Server, this); });
        this.logger.log('Done adding %d support providers, listening...', this.listenListeners.length);
        return new Promise((res, rej) => {
            https2Server.listen(port, host, () => {
                if (!silent)
                    this.logger.log('Listening (https2) on %s:%d...', host, port);
                res();
            });
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = XPress;
function parsePath(path) {
    let result = {
        regex: null,
        params: [],
        handlers: {}
    };
    path = path.replace(URL_START_REPLACER, '');
    let starCount = 0;
    result.regex = new RegExp('^/' + path.split('/').map(part => {
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
function developerErrorPageHandler(title, desc, stack = undefined) {
    if (title)
        title = utils_1.encodeHtmlSpecials(title).replace(/\n/g, '<br>');
    if (desc)
        desc = utils_1.encodeHtmlSpecials(desc).replace(/\n/g, '<br>');
    if (stack)
        stack = utils_1.encodeHtmlSpecials(stack).replace(/\n/g, '<br>');
    return `<!DOCTYPE html><html><head><title>${title}</title></head><body><h1>${desc}</h1><hr>${stack ? `<code>${stack}</code>` : ''}<hr><h2>uFramework xPress</h2></body></html>`;
}
exports.developerErrorPageHandler = developerErrorPageHandler;
function userErrorPageHandler(hello, whatHappened, sorry, post) {
    if (hello)
        hello = utils_1.encodeHtmlSpecials(hello.replace(/\n/g, '<br>'));
    if (whatHappened)
        whatHappened = utils_1.encodeHtmlSpecials(whatHappened.replace(/\n/g, '<br>'));
    if (sorry)
        sorry = utils_1.encodeHtmlSpecials(sorry.replace(/\n/g, '<br>'));
    if (post)
        post = utils_1.encodeHtmlSpecials(post.replace(/\n/g, '<br>'));
    return `<html><head></head><body style='font-family:Arial,sans-serif;font-size:22px;color:#CCC;background:#222;padding:40px;'>${hello}<br/><br/><span style='color:#FC0;font-weight:600;'>${whatHappened}</span><br/><br/>${sorry}<br/><br/><span style='font-size: 14px;'>${post}</span></body></html>`;
}
exports.userErrorPageHandler = userErrorPageHandler;
//# sourceMappingURL=index.js.map