import Logger from '@meteor-it/logger';

import * as multipart from './multipart';

import {EventEmitter} from 'events';
import * as http from 'http';
import {METHODS,IncomingMessage} from 'http';
import * as https from 'https';
import {parse as parseUrl, resolve} from 'url';
import {stringify} from 'querystring';
import * as zlib from 'zlib';
import iconv from 'iconv-lite';

export * from './multipart';

const POSSIBLE_EVENTS = [...METHODS];
const POSSIBLE_MIDDLEWARES = ['STREAM'];

const USER_AGENT = 'Meteor-IT XRest';

// TODO: Http2
// TODO: Re-enable gzipped requests

const decoders = {
    // gzip(buf) {
    //     return new Promise((res,rej)=>{
    //         zlib.gunzip(buf, (err,result)=>err?rej(err):res(result));
    //     });
    // },
    // deflate(buf, callback) {
    //     return new Promise((res,rej)=>{
    //         zlib.inflate(buf, (err,result)=>err?rej(err):res(result));
    //     });
    // }
};
const parsers = {
    json(text, cb) {
        try {
            cb(null, JSON.parse(text));
        } catch (e) {
            cb(null, text);
        }
    }
};

class Request extends EventEmitter {
    url;
    options;
    headers;
    request: any;
    aborted: boolean;
    timedout: boolean;

    constructor(url, options) {
        super();
        this.prepare(url, options);
    }

    prepare(url, options) {
        logger.debug('prepare(%s)', url);
        if (url.indexOf('undefined') + 1) {
            logger.warn('undefined found in request url! Stack for reference:');
            logger.warn(new Error('reference stack').stack);
        }
        this.url = parseUrl(url);
        this.options = options;
        this.headers = {
            'Accept': '*/*',
            'User-Agent': USER_AGENT,
            'Host': this.url.host,
            //'Accept-Encoding': 'gzip, deflate',
            ...options.headers
        };

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
                this.url.query = stringify(this.options.query);
            else this.url.query = this.options.query;
        }
        this.applyAuth();

        if (this.options.multipart) {
            this.headers['Content-Type'] = `multipart/form-data; boundary=${multipart.DEFAULT_BOUNDARY}`;
            const multipartSize = multipart.sizeOf(this.options.data, multipart.DEFAULT_BOUNDARY);
            if (!isNaN(multipartSize))
                this.headers['Content-Length'] = multipartSize;
            else
                throw new Error('Cannot get Content-Length!');
        }
        else {
            if (typeof this.options.data === 'object' && !Buffer.isBuffer(this.options.data)) {
                this.options.data = stringify(this.options.data);
                this.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                this.headers['Content-Length'] = this.options.data.length;
            }
            if (typeof this.options.data === 'string') {
                const buffer = new Buffer(this.options.data, this.options.encoding || 'utf8');
                this.options.data = buffer;
                this.headers['Content-Length'] = buffer.length;
            }
            if (!this.options.data) {
                this.headers['Content-Length'] = 0;
            }
        }

        const proto:any = (this.url.protocol === 'https:') ? https : http;

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
    }

    static isRedirect(response) {
        return ([301, 302, 303, 307].includes(response.statusCode));
    }

    fullPath() {
        let path = this.url.pathname || '/';
        if (this.url.hash) path += this.url.hash;
        if (this.url.query) path += `?${this.url.query}`;
        return path;
    }

    applyAuth() {
        let authParts;

        if (this.url.auth) {
            authParts = this.url.auth.split(':');
            this.options.username = authParts[0];
            this.options.password = authParts[1];
        }

        if (this.options.username && this.options.password !== undefined) {
            const b = new Buffer([this.options.username, this.options.password].join(':'));
            this.headers['Authorization'] = `Basic ${b.toString('base64')}`;
        }
        else if (this.options.accessToken) {
            this.headers['Authorization'] = `Bearer ${this.options.accessToken}`;
        }
    }

    responseHandler(response) {
        if (Request.isRedirect(response) && this.options.followRedirects) {
            try {
                // 303 should redirect and retrieve content with the GET method
                // http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.3.4
                if (response.statusCode === 303) {
                    this.url = parseUrl(resolve(this.url.href, response.headers['location']));
                    this.options.method = 'GET';
                    delete this.options.data;
                    this.reRetry();
                }
                else {
                    this.url = parseUrl(resolve(this.url.href, response.headers['location']));
                    this.reRetry();
                    // TODO: Handle somehow infinite redirects
                }
            }
            catch (err) {
                err.message = `Failed to follow redirect: ${err.message}`;
                this.fireError(err, response);
            }
        }
        else {
            let body = '';

            // When using browserify, response.setEncoding is not defined
            if (typeof response.setEncoding === 'function')
                response.setEncoding('binary');

            response.on('data', chunk => {
                body += chunk;
            });

            response.on('end', async () => {
                response.rawEncoded = body;
                try {
                    body = await Request.decode(new Buffer(body, 'binary'), response);
                    response.raw = body;
                    body = await Request.iconv(body, response);
                    this.encode(body, response, (err, body) => {
                        if (err) {
                            this.fireError(err, response);
                        }
                        else {
                            this.fireSuccess(body, response);
                        }
                    });
                }catch(e){
                    this.fireError(e,response);
                }
            });
        }
    }

    static async decode(body, response) {
        const decoder = response.headers['content-encoding'];

        if (decoder in decoders) {
            return await decoders[decoder].call(response, body);
        }
        else {
            return body;
        }
    }

    static iconv(body, response) {
        let charset = response.headers['content-type'];
            if (charset) {
                charset = /\bcharset=(.+)(?:;|$)/i.exec(charset);
                if (charset) {
                    charset = charset[1].trim().toUpperCase();
                    if (charset !== 'UTF-8')
                        try {
                            return iconv.decode(body, charset);
                        }catch(e){}
                }
            }
        return Promise.resolve(body);
    }

    encode(body, response, callback) {
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
    }

    fireError(err, response) {
        this.fireCancelTimeout();
        this.emit('error', err, response);
        this.emit('complete', err, response);
    }

    fireCancelTimeout() {
        if (this.options.timeout) {
            clearTimeout(this.options.timeoutFn);
        }
    }

    fireTimeout(err) {
        this.emit('timeout', err);
        this.aborted = true;
        this.timedout = true;
        this.request.abort();
    }

    fireSuccess(body, response) {
        if (parseInt(response.statusCode, 10) >= 400) {
            this.emit('fail', body, response);
        }
        else {
            this.emit('success', body, response);
        }
        this.emit(response.statusCode.toString().replace(/\d{2}$/, 'XX'), body, response);
        this.emit(response.statusCode.toString(), body, response);
        this.emit('complete', body, response);
    }

    makeRequest() {
        const timeoutMs = this.options.timeout;
        if (timeoutMs) {
            this.options.timeoutFn = setTimeout(() => {
                this.fireTimeout(timeoutMs);
            }, timeoutMs);
        }
        this.request.on('response', response => {
            this.fireCancelTimeout();
            this.emit('response', response);
            this.responseHandler(response);
        }).on('error', err => {
            this.fireCancelTimeout();
            if (!this.aborted) {
                this.fireError(err, null);
            }
        });
    }

    reRetry() {
        this.request.removeAllListeners().on('error', () => {
        });
        if (this.request.finished) {
            this.request.abort();
        }
        this.prepare(this.url.href, this.options); // reusing request object to handle recursive calls and remember listeners
        this.run();
    }

    async run() {
        if (this.options.multipart) {
            await multipart.write(this.request, this.options.data, () => {
                this.request.end();
            });
        }
        else {
            if (this.options.data) {
                this.request.write(this.options.data, this.options.encoding || 'utf8');
            }
            this.request.end();
        }

        return this;
    }

    abort(err) {
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

        this.request.on('close', () => {
            if (err) {
                this.fireError(err, null);
            }
            else {
                this.emit('complete', null, null);
            }
        });

        this.aborted = true;
        this.request.abort();
        this.emit('abort', err);
        return this;
    }

    retry(timeout) {
        timeout = parseInt(timeout, 10);
        const fn = this.reRetry.bind(this);
        if (!isFinite(timeout) || timeout <= 0) {
            process.nextTick(fn, timeout);
        }
        else {
            setTimeout(fn, timeout);
        }
        return this;
    }
}

const logger = new Logger('xrest');

export interface IXResponse extends IncomingMessage {
    body: any;
    raw: Buffer;
    headers: any;
}

export function emit(eventString: string, options: any = {}): Promise<IXResponse> {
    let [event, path, ...middlewares] = eventString.split(' ');
    let middleFunctions = [];
    for (let middleware of middlewares) {
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
    const request = new Request(path, options);
    return new Promise((res,rej)=>{
        request.run();
        request.on('timeout',async (ms)=>{
            logger.warn('Timeout, repeat in 15 s');
            await new Promise(res=>setTimeout(res,150000));
            try{
                let data=await emit(eventString,options);
                res(data);
            }catch(e){
                rej(e);
            }
        });
        request.on('complete',(result,response)=>{
            if(result instanceof Error) {
                rej(result);
                return;
            }
            response.body=result;
            res(response);
        });
    });
}

export default class XRest {
    baseUrl;
    defaultOptions;

    constructor(url, defaultOptions) {
        logger.debug('new XRest(%s)', url);
        this.baseUrl = url;
        this.defaultOptions = defaultOptions;
    }

    emit(eventString, options) {
        let [event, path, ...middlewares] = eventString.split(' ');
        let opts={};
        Object.assign(opts,this.defaultOptions,options);
        path = resolve(this.baseUrl, path);
        return emit([event, path, ...middlewares].join(' '), opts);
    }
}