import http2, { Http2ServerRequest, Http2ServerResponse, IncomingHttpHeaders } from 'http2';
import http, { OutgoingHttpHeaders, ServerResponse, IncomingMessage } from 'http';
import url from 'url';
import path from 'path';
import { Readable } from "stream";
import { Socket } from 'net';
import fs from "fs";
import { EventEmitter } from 'events';

import Logger from '@meteor-it/logger';
import URouter from "@meteor-it/router";
import { userErrorPage, developerErrorPage } from './errorPages';
export { userErrorPage, developerErrorPage };

export interface IClientOptions {
    protocol?: string;
    agent?: http.Agent;
    headers?: { [key: string]: string };
    protocolVersion?: any;
    host?: string;
    origin?: string;
    pfx?: any;
    key?: any;
    passphrase?: string;
    cert?: any;
    ca?: any[];
    ciphers?: string;
    rejectUnauthorized?: boolean;
}

declare class WebSocket extends EventEmitter {
    static CONNECTING: number;
    static OPEN: number;
    static CLOSING: number;
    static CLOSED: number;

    bytesReceived: number;
    readyState: number;
    protocolVersion: string;
    url: string;
    supports: any;
    upgradeReq: http.IncomingMessage;
    protocol: string;

    CONNECTING: number;
    OPEN: number;
    CLOSING: number;
    CLOSED: number;

    onopen: (event: { target: WebSocket }) => void;
    onerror: (err: Error) => void;
    onclose: (event: { wasClean: boolean; code: number; reason: string; target: WebSocket }) => void;
    onmessage: (event: { data: any; type: string; target: WebSocket }) => void;

    constructor(address: string, options?: IClientOptions);
    constructor(address: string, protocols?: string | string[], options?: IClientOptions);

    close(code?: number, data?: any): void;
    pause(): void;
    resume(): void;
    ping(data?: any, options?: { mask?: boolean; binary?: boolean }, dontFail?: boolean): void;
    pong(data?: any, options?: { mask?: boolean; binary?: boolean }, dontFail?: boolean): void;
    send(data: any, cb?: (err: Error) => void): void;
    send(data: any, options: { mask?: boolean; binary?: boolean }, cb?: (err: Error) => void): void;
    stream(options: { mask?: boolean; binary?: boolean }, cb?: (err: Error, final: boolean) => void): void;
    stream(cb?: (err: Error, final: boolean) => void): void;
    terminate(): void;

    // HTML5 WebSocket events
    addEventListener(method: 'message', cb?: (event: { data: any; type: string; target: WebSocket }) => void): void;
    addEventListener(method: 'close', cb?: (event: {
        wasClean: boolean; code: number;
        reason: string; target: WebSocket
    }) => void): void;
    addEventListener(method: 'error', cb?: (err: Error) => void): void;
    addEventListener(method: 'open', cb?: (event: { target: WebSocket }) => void): void;
    addEventListener(method: string, listener?: (...args: any[]) => void): void;

    // Events
    on(event: 'error', cb: (this: this, err: Error) => void): this;
    on(event: 'close', cb: (this: this, code: number, message: string) => void): this;
    on(event: 'message', cb: (this: this, data: any, flags: { binary: boolean }) => void): this;
    on(event: 'ping', cb: (this: this, data: any, flags: { binary: boolean }) => void): this;
    on(event: 'pong', cb: (this: this, data: any, flags: { binary: boolean }) => void): this;
    on(event: 'open', cb: (this: this) => void): this;
    on(event: string, listener: (this: this, ...args: any[]) => void): this;

    addListener(event: 'error', cb: (err: Error) => void): this;
    addListener(event: 'close', cb: (code: number, message: string) => void): this;
    addListener(event: 'message', cb: (data: any, flags: { binary: boolean }) => void): this;
    addListener(event: 'ping', cb: (data: any, flags: { binary: boolean }) => void): this;
    addListener(event: 'pong', cb: (data: any, flags: { binary: boolean }) => void): this;
    addListener(event: 'open', cb: () => void): this;
    addListener(event: string, listener: (...args: any[]) => void): this;
}

export class XpressRouterStream {
    req: Http2ServerRequest;
    res: Http2ServerResponse;
    socket: WebSocket;
    reqHeaders: IncomingHttpHeaders;
    resHeaders: OutgoingHttpHeaders;

    constructor(reqHeaders: IncomingHttpHeaders, resHeaders: OutgoingHttpHeaders) {
        this.reqHeaders = reqHeaders;
        this.resHeaders = resHeaders;
    }

    status(status: number): this {
        if (status > 999 || status < 100) throw new Error('incorrect status passed');
        this.resHeaders[http2.constants.HTTP2_HEADER_STATUS] = status;
        return this;
    }

    /**
     * Sends data
     * @param text
     */
    send(text: string | Buffer) {
        this.hasDataSent = true;
        this.respond();
        if (this.isHttp2) {
            this.res.stream.write(text);
            this.res.stream.end();
        } else {
            this.res.write(text);
            this.res.end();
        }
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Pipes stream to real stream
     * @param stream
     */
    sendStream(stream: Readable) {
        this.hasDataSent = true;
        if (this.isHttp2) {
            this.respond();
            stream.pipe(this.res.stream);
        } else {
            this.respond();
            stream.pipe(this.res as unknown as ServerResponse);
        }
    }

    /**
     * Just sends file, without any header modifications
     * Complex sends should be handled by users
     * @param path
     */
    sendFile(path: string) {
        this.hasDataSent = true;
        if (this.isHttp2) {
            this.res.stream.respondWithFile(path, this.resHeaders, {});
        } else {
            this.respond();
            fs.createReadStream(path).pipe(this.res as unknown as ServerResponse);
        }
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * After this call, developer should handle everything yourself
     */
    respond() {
        this.hasDataSent = true;
        if (this.isHttp2) {
            this.res.stream.respond(this.resHeaders);
        } else {
            const newHeaders: { [key: string]: string | number | string[] | undefined } = {};
            for (let key in this.resHeaders) {
                if (key !== http2.constants.HTTP2_HEADER_STATUS)
                    newHeaders[key] = this.resHeaders[key];
            }
            this.res.writeHead(this.resHeaders[http2.constants.HTTP2_HEADER_STATUS] as number || 200, newHeaders);
        }
    }

    acceptsEncoding(encoding: string) {
        return ((this.reqHeaders[http2.constants.HTTP2_HEADER_ACCEPT_ENCODING] as string || '').split(',').map(e => e.trim()).includes(encoding));
    }


    /**
     * Define multiplex point
     * @param path
     */
    pushStream(path: string): Promise<XpressRouterStream> {
        return new Promise((res, rej) => {
            if (!this.canPushStream) return rej(new Error("pushStream isn't supported for this session"));
            // @types/node sucks for http2
            this.res.stream.pushStream({ ...this.resHeaders, [http2.constants.HTTP2_HEADER_PATH]: path }, (err, stream, resHeaders) => {
                if (err) return rej(err);
                stream.on('error', (err) => {
                    const isRefusedStream = (err as any).code === 'ERR_HTTP2_STREAM_ERROR' &&
                        stream.rstCode === http2.constants.NGHTTP2_REFUSED_STREAM;
                    if (!isRefusedStream)
                        throw err;
                });

                const wrap = new XpressRouterStream(this.reqHeaders, {});
                wrap.isSecure = this.isSecure;
                wrap.res = { ...this.res, stream } as any;
                res(wrap);
            });
        });
    };

    hasDataSent: boolean = false;

    get canPushStream(): boolean {
        return this.hasStream && this.res.stream.pushAllowed;
    }

    get isHttp2(): boolean {
        return this.hasStream;
    }

    isSecure: boolean;

    get hasStream(): boolean {
        return !!(this.res && this.res.stream);
    }

    get hasSocket(): boolean {
        return !!this.socket;
    }
}

export interface XPressRouterContext {

    query: { [key: string]: string };
    socket: WebSocket;
    stream: XpressRouterStream;
}

/**
 * Throw this error if you want to customize XPress error message
 * (By default, all thrown errors are displayed as 500 Internal Server Error)
 */
export class HttpError extends Error {
    code: number;

    constructor(code: number, message: string) {
        super(message);
        this.code = code;
    }
}

// noinspection JSUnusedGlobalSymbols
/**
 * Routing helper to pass default XPress context
 * Read docs of Router
 */
export class Router<S> extends URouter<XPressRouterContext, S> {
    constructor(defaultState: (() => S) | null = null) {
        super(defaultState);
    }
}

// noinspection RegExpRedundantEscape
let PATH_SEP_REGEXP = null;

// Default config
const WS_SERVER_CONFIG = {
    perMessageDeflate: {
        zlibDeflateOptions: { // See zlib defaults.
            chunkSize: 1024,
            memLevel: 7,
            level: 3,
        },
        zlibInflateOptions: {
            chunkSize: 10 * 1024
        },
        // Other options settable:
        clientNoContextTakeover: true, // Defaults to negotiated value.
        serverNoContextTakeover: true, // Defaults to negotiated value.
        clientMaxWindowBits: 10,       // Defaults to negotiated value.
        serverMaxWindowBits: 10,       // Defaults to negotiated value.
        // Below options specified as default values.
        concurrencyLimit: 10,          // Limits zlib concurrency for perf.
        threshold: 1024,               // Size (in bytes) below which messages
        // should not be compressed.
    }
};

let INTWebSocket;
let INTWSServer;

/**
 * Because uws module imports it's own native library and throws if them doesn't exits.
 */
function fixNotPure() {
    const uws = __non_webpack_require__('@discordjs/uws');
    let { default: WebSocket, Server } = uws;
    INTWSServer = Server;
    INTWebSocket = WebSocket;
}

/**
 * XPress web server API
 */
export default class XPress<S> extends URouter<XPressRouterContext, S, 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'WS'> {
    logger: Logger;

    constructor(name: string | Logger, defaultState: (() => S) | null = null) {
        super(defaultState);
        this.logger = Logger.from(name);
    }

    // noinspection JSMethodCanBeStatic
    private async requestHandler(isSecure: boolean, req: Http2ServerRequest, res: Http2ServerResponse) {
        if (PATH_SEP_REGEXP === null) PATH_SEP_REGEXP = new RegExp(`\\${path.sep}`, 'g');
        const urlString = req.url as string || req.headers[http2.constants.HTTP2_HEADER_PATH] as string;
        let { pathname, query } = url.parse(urlString, true);
        if (pathname === undefined) {
            res.stream.destroy();
            return;
        }
        pathname = path.normalize(pathname).replace(PATH_SEP_REGEXP, '/');
        const method = req.method || req.headers[http2.constants.HTTP2_HEADER_METHOD];
        const wrappedMainStream = new XpressRouterStream(req.headers, {});
        wrappedMainStream.isSecure = isSecure;
        wrappedMainStream.req = req;
        wrappedMainStream.res = res;
        try {
            await this.route(pathname, ctx => {
                ctx.query = query as { [key: string]: string };
                ctx.method = method as any;
                ctx.stream = wrappedMainStream;
                ctx.socket = null;
            });
            if (!wrappedMainStream.hasDataSent && !wrappedMainStream.res.headersSent) {
                wrappedMainStream.resHeaders = {};
                wrappedMainStream.status(404).send(developerErrorPage('404: Page Not Found', `Page not found at ${pathname}`, process.env.NODE_ENV === 'production' ? undefined : new Error('Reference stack').stack));
            }
        } catch (e) {
            this.logger.error(e.stack);
            if (!wrappedMainStream.hasDataSent && !wrappedMainStream.res.headersSent) {
                wrappedMainStream.resHeaders = {};
                wrappedMainStream.status(500).send(developerErrorPage('500: Internal Server Error', e.message, process.env.NODE_ENV === 'production' ? undefined : e.stack));
            }
        }
    }

    /**
     * HTTP/1
     * @param request
     * @param socket
     * @param head
     */
    private async upgradeHandler(isSecure: boolean, request: IncomingMessage, socket: Socket, head: ArrayBuffer) {
        const headers = request.headers;
        const urlString = request.url;
        if (urlString === undefined) {
            socket.destroy();
            return;
        }
        let { pathname, query } = url.parse(urlString, true);
        if (pathname === undefined) {
            socket.destroy();
            return;
        }
        pathname = path.normalize(pathname).replace(PATH_SEP_REGEXP, '/');
        const method = request.method;
        const upgradeType = headers[http2.constants.HTTP2_HEADER_UPGRADE];
        if (upgradeType === 'websocket' && method === 'GET') {
            this.wsServer.handleUpgrade(request, socket, head, async (ws) => {
                const wrapperMainStream = new XpressRouterStream(headers, {});
                wrapperMainStream.isSecure = isSecure;
                wrapperMainStream.socket = ws;
                await this.route(pathname as string, ctx => {
                    ctx.query = query as { [key: string]: string };
                    ctx.method = 'WS';
                    ctx.stream = wrapperMainStream;
                    ctx.socket = ws;
                });
                // Dirty check for handled websocket
                // Will break on UWS update
                // https://github.com/discordjs/uws/blob/master/src/uws.js#L90
                if ((wrapperMainStream.socket as any).internalOnMessage === (wrapperMainStream.socket as any).internalOnClose) {
                    // 1005 - CLOSED_NO_STATUS
                    wrapperMainStream.socket.close(1005);
                }
            });
        } else {
            // IDK how to handle
            socket.destroy();
        }
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * bind()
     * @param host host to bind on
     * @param port port to bind on
     */
    listenHttp(host = '0.0.0.0', port: number) {
        this.ensureWebSocketReady();
        let server = http.createServer(this.requestHandler.bind(this, false));
        // There is no ALPN negotigation for HTTP/1 over TLS D:
        // And, since HTTP/2 over tcp isn't supported in browsers,
        // Http server is only for HTTP/1.
        // TODO: Add option for listening HTTP/2 over TCP for reverse-proxy purposes
        // server.on('stream', this.streamHandler.bind(this));
        server.on('upgrade', this.upgradeHandler.bind(this, false));
        return new Promise((res, rej) => {
            server.listen(port, host, () => {
                this.logger.debug('Listening (http) on %s:%d...', host, port);
                res();
            });
        });
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * bind()
     * @param host host to bind on
     * @param port port to bind on
     * @param options settings
     */
    listenHttps(host = '0.0.0.0', port: number, { key, cert }: { key?: Buffer, cert?: Buffer }): Promise<void> {
        this.ensureWebSocketReady();
        let server = http2.createSecureServer({
            key, cert,
            allowHTTP1: true
        }, this.requestHandler.bind(true));
        // server.on('stream', this.streamHandler.bind(this));
        server.on('upgrade', this.upgradeHandler.bind(this, true));
        return new Promise((res, rej) => {
            server.listen(port, host, () => {
                this.logger.debug('Listening (https) on %s:%d...', host, port);
                res();
            });
        });
    }

    /**
     * reserved bind() for quic (HTTP/3)
     * @param host
     * @param port
     * @param param2
     */
    listenQuic(host = '0.0.0.0', port: number, { key, cert }: { key?: Buffer, cert?: Buffer }): Promise<void> {
        throw new Error('reserved');
    }

    wsServer: any;

    private ensureWebSocketReady() {
        if (this.wsServer) return;
        if (process.env.NODE) fixNotPure();
        this.wsServer = new INTWSServer({ noServer: true });
    }
}
