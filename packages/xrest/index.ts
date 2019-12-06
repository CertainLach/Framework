import * as http from 'http';
import * as https from 'https';
import * as iconv from 'iconv-lite';
import * as querystring from 'querystring';
import { Stream, Transform } from 'stream';
import * as url from 'url';
import * as zlib from 'zlib';
import { DEFAULT_BOUNDARY, IMultiPartData, sizeOf, write } from "./multipart";

export { IMultiPartData };

const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64; rv:70.0) Gecko/20100101 Firefox/70.0';

// TODO: More assertions

const compressors: Map<string, () => Transform> = new Map();
compressors.set('gzip', () => zlib.createGunzip());
compressors.set('deflate', () => zlib.createInflate());

export type IRequestHeaders = { [key: string]: string | number };
export type IRequestOptions = {
    /**
     * Additional headers to include with request
     */
    headers?: IRequestHeaders;
    /**
     * POST data
     */
    data?: Buffer | string | IMultiPartData;
    /**
     * Request method
     */
    method?: string;
    /**
     * Should library follow redirect responses
     */
    followRedirects?: boolean;
    /**
     * Time allowed to make a request
     * if 0 - then request can long forever
     */
    timeout?: number;

    /**
     * Request query parameters
     */
    query?: string | { [key: string]: string | number };
    /**
     * Should data field to be handled as IMultiPartData
     */
    multipart?: boolean;

    customTransformBeforeDecompression?: () => Transform;
    skipDecompression?: boolean;
    customTransformBeforeCharsetTransform?: () => Transform;
    skipCharsetProcessing?: boolean;
    customTransformBeforeDecoder?: () => Transform;

    rawBody?: boolean;

    encoding?: "ascii" | "utf8" | "utf-8" | "utf16le" | "ucs2" | "ucs-2" | "base64" | "latin1" | "binary" | "hex";
    compressor?: string;

    rejectUnauthorized?: boolean;
    agent?: http.Agent;
    /**
     * Internal
     * TODO: Move to Request
     */
    timeoutFn?: any;

    /**
     * login for the basic auth
     */
    username?: string;
    /**
     * password for the basic auth
     */
    password?: string;
    /**
     * token for the bearer auth
     */
    accessToken?: string;

    /**
     * Should not parse response
     */
    streaming?: boolean;
}
export class TimeoutError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TimeoutError';
    }
}
export class BadResponseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'BadResponseError';
    }
}
export class AbortError extends Error {
    constructor() {
        super();
        this.name = 'AbortError';
    }
}

export class ExtendedIncomingMessage {
    constructor(public raw: http.IncomingMessage) { }

    rawBody?: Buffer;
    body?: string;

    private _jsonBody?: any;
    get jsonBody(): any | undefined {
        if (this.body === undefined)
            return undefined;
        if (this._jsonBody !== undefined)
            return this._jsonBody;
        return this._jsonBody = JSON.parse(this.body);
    }

    get headers(): http.IncomingHttpHeaders {
        return this.raw.headers;
    }
    get statusCode(): number | undefined {
        return this.raw.statusCode;
    }
}

class Request {
    url?: string;
    parsedUrl: url.Url;
    headers?: IRequestHeaders;
    request?: http.ClientRequest;
    aborted?: boolean;
    timedout?: boolean;

    constructor(urlStr: string, public options: IRequestOptions, public resolve: (res: ExtendedIncomingMessage) => void, public reject: (err: Error) => void) {
        this.parsedUrl = url.parse(urlStr);
        this.prepare(urlStr, options);
    }

    prepare(urlStr: string, options: IRequestOptions) {
        this.parsedUrl = url.parse(urlStr);
        this.options = options;
        this.headers = {
            'Accept': '*/*',
            'User-Agent': USER_AGENT,
            'Accept-Encoding': [...compressors.keys()].join(', '),
            ...options.headers
        };
        if (this.parsedUrl.host && !this.headers['host'])
            this.headers['host'] = this.parsedUrl.host;

        // set port and method defaults
        if (!this.parsedUrl.port)
            this.parsedUrl.port = (this.parsedUrl.protocol === 'https:') ? '443' : '80';
        if (!this.options.method)
            this.options.method = (this.options.data) ? 'POST' : 'GET';
        if (this.options.followRedirects === undefined)
            this.options.followRedirects = true;
        if (this.options.timeout === undefined)
            this.options.timeout = 12000;
        if (this.options.method === 'GET' && this.options.data)
            throw new Error('GET requests doesn\'t supports request body!');

        // stringify query given in options of not given in URL
        if (this.options.query) {
            if (typeof this.options.query === 'object')
                this.parsedUrl.query = querystring.stringify(this.options.query);
            else this.parsedUrl.query = this.options.query;
        }
        this.applyAuth();

        if (this.options.multipart) {
            if (!this.options.data)
                throw new Error('No data is defined for multipart request!');
            if (this.options.data instanceof Buffer || typeof this.options.data === 'string')
                throw new Error('When multipart mode is enabled, you cannot pass plain data!');
            this.headers['Content-Type'] = `multipart/form-data; boundary=${DEFAULT_BOUNDARY}`;
            const multipartSize = sizeOf(this.options.data, DEFAULT_BOUNDARY);
            if (!isNaN(multipartSize))
                this.headers['Content-Length'] = multipartSize;
            else throw new Error('Cannot get Content-Length!');
        } else {
            if (typeof this.options.data === 'object' && !Buffer.isBuffer(this.options.data)) {
                this.options.data = querystring.stringify(this.options.data);
                this.headers['Content-Type'] = 'application/x-www-form-urlencoded';
                this.headers['Content-Length'] = this.options.data.length;
            } else if (typeof this.options.data === 'string') {
                const buffer = new Buffer(this.options.data, this.options.encoding || 'utf8');
                this.options.data = buffer;
                this.headers['Content-Length'] = buffer.length;
            } else if (!this.options.data) {
                this.headers['Content-Length'] = 0;
            }
        }

        const proto: typeof http | typeof https = (this.parsedUrl.protocol === 'https:') ? https : http;

        this.request = proto.request({
            host: this.parsedUrl.hostname,
            port: this.parsedUrl.port,
            path: this.fullPath,
            method: this.options.method,
            headers: this.headers,
            rejectUnauthorized: this.options.rejectUnauthorized,
            agent: this.options.agent
        });
        this.makeRequest();
    }

    /**
     * Test if response is a redirect to the another page
     * @param response
     */
    static isRedirect(response: http.IncomingMessage): boolean {
        if (!response.statusCode)
            return false;
        return ([301, 302, 303, 307, 308].includes(response.statusCode));
    }

    get fullPath(): string {
        let path = this.parsedUrl.pathname || '/';
        if (this.parsedUrl.hash) path += this.parsedUrl.hash;
        if (this.parsedUrl.query) path += `?${this.parsedUrl.query}`;
        return path;
    }

    applyAuth(): void {
        if (!this.headers) throw new Error('request is not initialized yet');
        let authParts;

        if (this.parsedUrl.auth) {
            authParts = this.parsedUrl.auth.split(':');
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

    responseHandler(response: http.IncomingMessage) {
        if (!this.headers) throw new Error('request is not initialized yet');

        if (Request.isRedirect(response) && this.options.followRedirects) {
            if (!response.headers['location'])
                return this.fireError(new BadResponseError(`location header is missing in redirect (${response.statusCode}) response`));
            try {
                // 303 should redirect and retrieve content with the GET method
                // http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html#sec10.3.4
                if (response.statusCode === 303) {
                    this.parsedUrl = url.parse(url.resolve(this.parsedUrl.href!, response.headers['location']));
                    this.options.method = 'GET';
                    delete this.options.data;
                    this.reRetry();
                } else {
                    this.parsedUrl = url.parse(url.resolve(this.parsedUrl!.href!, response.headers['location']));
                    this.reRetry();
                }
                // TODO: Handle somehow infinite redirects
            } catch (err) {
                err.message = `Failed to follow redirect: ${err.message}`;
                return this.fireError(err);
            }
        } else {
            let stream: Stream = response;
            stream.on('error', e => {
                this.fireError(e);
            });
            if (this.options.customTransformBeforeDecompression)
                stream = stream.pipe(this.options.customTransformBeforeDecompression());
            if (!this.options.skipDecompression) {
                const compressor = response.headers['content-encoding'];
                const needsToBeDecompressed = !!compressor;
                const decompressable = compressor && compressors.has(compressor);
                if (needsToBeDecompressed && !decompressable)
                    return this.fireError(new BadResponseError(`stream can't be decompressed, unknown encoding: ${response.headers['content-encoding']}; you can skip decompression via skipDecompression option`));
                if (compressor && compressors.has(compressor)) {
                    stream = stream.pipe(compressors.get(compressor)!());
                }
            }
            if (!this.options.skipCharsetProcessing) {
                let contentType = response.headers['content-type'];
                if (contentType) {
                    let charsetRegexpResult = /\bcharset=(.+)(?:;|$)/i.exec(contentType);
                    if (charsetRegexpResult) {
                        let charset = charsetRegexpResult[1].trim().toUpperCase();
                        if (charset !== 'UTF-8') {
                            stream = stream.pipe(iconv.decodeStream(charset));
                        }
                    }
                }
            }
            if (!this.options.streaming) {
                // Read fully and output to body
                const bodyParts: Buffer[] = [];
                stream.on('data', chunk => {
                    bodyParts.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
                });
                stream.on('end', async () => {
                    const body = Buffer.concat(bodyParts);

                    const result = new ExtendedIncomingMessage(response);
                    result.rawBody = body;
                    if (!this.options.rawBody)
                        result.body = body.toString(this.options.encoding);
                    this.fireSuccess(result);
                });
            } else {
                // because inner stream is transformed, but we still need to return valid incomming message
                const { httpVersion, httpVersionMajor, httpVersionMinor, connection, headers, rawHeaders,
                    trailers, rawTrailers, statusCode, statusMessage, socket } = response;
                const incomingMessage: http.IncomingMessage = Object.assign(stream, {
                    httpVersion, httpVersionMajor, httpVersionMinor, connection, headers, rawHeaders,
                    trailers, rawTrailers, statusCode, statusMessage, socket
                }) as http.IncomingMessage;
                // return without decoding/reading anything
                this.fireSuccess(new ExtendedIncomingMessage(incomingMessage));
            }
        }
    }

    fireError(error: Error) {
        this.cancelTimeout();
        this.reject(error);
    }

    private cancelTimeout() {
        if (this.options.timeoutFn)
            clearTimeout(this.options.timeoutFn);
    }

    fireTimeout(time: number) {
        this.aborted = true;
        this.timedout = true;
        this.request!.abort();
        this.fireError(new TimeoutError(`request isn't completed in ${time}ms`));
    }

    fireSuccess(response: ExtendedIncomingMessage) {
        this.resolve(response);
    }

    makeRequest() {
        const timeoutMs = this.options.timeout;
        if (timeoutMs) {
            this.options.timeoutFn = setTimeout(() => {
                this.fireTimeout(timeoutMs);
            }, timeoutMs);
        }
        this.request!.on('response', (response: http.IncomingMessage) => {
            this.cancelTimeout();
            this.responseHandler(response);
        }).on('error', (err: Error) => {
            this.cancelTimeout();
            if (!this.aborted) {
                this.fireError(err);
            }
        });
    }

    async reRetry() {
        this.request!.removeAllListeners().on('error', () => {
        });
        if (this.request!.finished) {
            this.request!.abort();
        }
        this.prepare(this.parsedUrl.href!, this.options); // reusing request object to handle recursive calls and remember listeners
        await this.run();
    }

    async run() {
        if (this.options.multipart) {
            await write(this.options.encoding ?? 'binary', this.request!, this.options.data as IMultiPartData);
            this.request!.end();
        } else {
            if (this.options.data)
                this.request!.write(this.options.data, this.options.encoding ?? 'utf8');
            this.request!.end();
        }

        return this;
    }

    // noinspection JSUnusedGlobalSymbols
    abort(err?: Error) {
        this.aborted = true;
        this.request!.abort();
        this.fireError(err ?? new AbortError());
        return this;
    }

    // noinspection JSUnusedGlobalSymbols
    retry(timeout: number) {
        const fn = this.reRetry.bind(this);
        if (!isFinite(timeout) || timeout <= 0) {
            process.nextTick(fn, timeout);
        } else {
            setTimeout(fn, timeout);
        }
        return this;
    }
}

function testMethod(method: string) {
    if (method.toUpperCase() !== method) {
        throw new Error(`Method name should be uppercase! (Got: ${method})`);
    }
    if (http.METHODS.indexOf(method) === -1) {
        throw new Error(`Unknown method: ${method}, possible methods are ${http.METHODS.join(', ')}!`);
    }
}

export function emitStreaming(method: string, path: string, options: IRequestOptions = {}): Promise<ExtendedIncomingMessage> {
    testMethod(method);
    options.method = method;
    options.streaming = true;

    return new Promise((res, rej) => {
        const request = new Request(path, options, res, rej);
        request.run();
    });
}

export function emit(method: string, path: string, options: IRequestOptions = {}): Promise<ExtendedIncomingMessage> {
    testMethod(method);
    options.method = method;
    options.streaming = false;
    return new Promise((res, rej) => {
        const request = new Request(path, options, res, rej);
        request.run();
    });
}

export default class XRest {
    baseUrl: string;
    defaultOptions: IRequestOptions;

    constructor(url: string, defaultOptions: IRequestOptions) {
        this.baseUrl = url;
        this.defaultOptions = defaultOptions;
    }

    // noinspection JSUnusedGlobalSymbols
    emit(event: string, path: string, options: IRequestOptions): Promise<ExtendedIncomingMessage> {
        path = url.resolve(this.baseUrl, path);
        return emit(event, path, { ...this.defaultOptions, ...options });
    }

    // noinspection JSUnusedGlobalSymbols
    emitStreaming(event: string, path: string, options: IRequestOptions): Promise<ExtendedIncomingMessage> {
        path = url.resolve(this.baseUrl, path);
        return emitStreaming(event, path, { ...this.defaultOptions, ...options });
    }

    // noinspection JSUnusedGlobalSymbols
    static emit(event: string, path: string, options: IRequestOptions): Promise<ExtendedIncomingMessage> {
        return emit(event, path, options);
    }

    // noinspection JSUnusedGlobalSymbols
    static emitStreaming(event: string, path: string, options: IRequestOptions): Promise<ExtendedIncomingMessage> {
        return emitStreaming(event, path, options);
    }
}
