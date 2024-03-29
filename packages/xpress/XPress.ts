import URouter from "@meteor-it/router";
import * as fs from "fs";
import * as http from 'http';
import { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'http';
import * as http2 from 'http2';
import { Http2ServerRequest, Http2ServerResponse, IncomingHttpHeaders, ServerHttp2Stream } from 'http2';
import { Socket } from 'net';
import * as path from 'path';
import { Readable } from "stream";
import * as WebSocket from 'ws';
import { developerErrorPage, userErrorPage } from './errorPages';
import { Logger } from 'winston';

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

export class XpressRouterStream {
    req?: Http2ServerRequest;
    res?: Http2ServerResponse;
    stream?: ServerHttp2Stream;
    socket?: WebSocket;
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
            this.http2Stream.write(text);
            this.http2Stream.end();
        } else {
            this.res!.write(text);
            this.res!.end();
        }
    }

    sendJSON(object: any, space?: number) {
        this.resHeaders[http2.constants.HTTP2_HEADER_CONTENT_TYPE] = 'application/json; charset=utf-8';
        this.send(JSON.stringify(object, null, space));
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
            stream.pipe(this.http2Stream);
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
            this.http2Stream.respondWithFile(path, this.resHeaders, {});
        } else {
            this.respond();
            fs.createReadStream(path).pipe(this.res as unknown as ServerResponse);
        }
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Unsafe
     * After this call, developer should handle everything yourself
     */
    respond() {
        this.hasDataSent = true;
        if (this.isHttp2) {
            this.http2Stream.respond(this.resHeaders);
        } else {
            const newHeaders: { [key: string]: string | number | string[] | undefined } = {};
            for (let key in this.resHeaders) {
                if (key !== http2.constants.HTTP2_HEADER_STATUS)
                    newHeaders[key] = this.resHeaders[key];
            }
            this.res!.writeHead(this.resHeaders[http2.constants.HTTP2_HEADER_STATUS] as number || 200, newHeaders);
        }
    }

    /**
     * Returns true if encoding specified in Accept-Encoding header
     * @param encoding encoding
     */
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
            this.http2Stream.pushStream({ ...this.resHeaders, [http2.constants.HTTP2_HEADER_PATH]: path }, (err, stream, resHeaders) => {
                if (err) return rej(err);
                stream.on('error', (err) => {
                    const isRefusedStream = (err as any).code === 'ERR_HTTP2_STREAM_ERROR' &&
                        stream.rstCode === http2.constants.NGHTTP2_REFUSED_STREAM;
                    if (!isRefusedStream)
                        throw err;
                });

                const wrap = new XpressRouterStream(this.reqHeaders, {});
                wrap.isSecure = this.isSecure;
                if (this.supportsHttp1Fallback) {
                    wrap.res = { ...this.res, stream } as any;
                } else {
                    wrap.stream = { ...this.stream, stream } as any;
                }
                res(wrap);
            });
        });
    };

    hasDataSent: boolean = false;

    /**
     * True - if response is not sent, and it's possible to call send()
     */
    get canSendMoreData(): boolean {
        return !this.hasDataSent && !this.res!.headersSent
    }

    /**
     * True if request is done via http2, and there is http2 push allowed
     */
    get canPushStream(): boolean {
        return this.hasStream && this.http2Stream.pushAllowed;
    }

    /**
     * Is stream sent over http2
     */
    get isHttp2(): boolean {
        return this.hasStream;
    }

    /**
     * Is request sent via tls
     */
    isSecure: boolean = false;

    get http2Stream(): ServerHttp2Stream {
        return this.res?.stream ?? this.stream!;
    }

    get supportsHttp1Fallback(): boolean {
        return !!this.res;
    }

    get hasStream(): boolean {
        return !!this.http2Stream;
    }

    /**
     * If request == websocket
     */
    get hasSocket(): boolean {
        return !!this.socket;
    }
}

export interface XPressRouterContext {
    searchParams: URLSearchParams;
    socket?: WebSocket;
    stream: XpressRouterStream;
}

/**
 * Throw this error if you want to customize XPress error message
 * (By default, all thrown errors are displayed as 500 Internal Server Error)
 */
export class HttpError extends Error {
    /**
     * Http status code
     */
    code: number;

    /**
     * @param code http status code
     * @param message server message
     */
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
    constructor(defaultState?: () => S) {
        super(defaultState);
    }
}

// noinspection RegExpRedundantEscape
let PATH_SEP_REGEXP = new RegExp(`\\${path.sep}`, 'g');

/**
 * XPress web server API
 */
export default class XPress<S> extends URouter<XPressRouterContext, S, 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'WS'> {
    logger: Logger;

    constructor(logger: Logger, defaultState?: () => S) {
        super(defaultState);
        this.logger = logger;
    }

    /**
     * Handles http2 streams
     * @param isSecure is stream sent over https
     * @param stream stream
     * @param headers stream headers
     * @param flags http2 stream flags
     */
    private async streamHandler(isSecure: boolean, stream: ServerHttp2Stream, headers: IncomingHttpHeaders, flags: number) {
        const urlStr = headers[http2.constants.HTTP2_HEADER_PATH] as string;
        let { pathname, searchParams } = new URL(urlStr, 'base:');
        if (pathname === undefined) {
            stream.end();
            return;
        }
        pathname = path.normalize(pathname).replace(PATH_SEP_REGEXP, '/');
        const method = headers[http2.constants.HTTP2_HEADER_METHOD] as any;
        const wrappedMainStream = new XpressRouterStream(headers, {});
        wrappedMainStream.isSecure = isSecure;
        wrappedMainStream.stream = stream;
        try {
            await this.route(pathname, ctx => {
                ctx.searchParams = searchParams;
                ctx.method = method as any;
                ctx.stream = wrappedMainStream;
                ctx.socket = undefined;
            });
            if (!wrappedMainStream.hasDataSent && !wrappedMainStream.res!.headersSent) {
                wrappedMainStream.resHeaders = {};
                wrappedMainStream.status(404).send(developerErrorPage('404: Page Not Found', `Page not found at ${pathname}`, process.env.NODE_ENV === 'production' ? undefined : new Error('Reference stack').stack));
            }
        } catch (e: any) {
            if (e instanceof HttpError) {
                if (wrappedMainStream.canSendMoreData) {
                    wrappedMainStream.status(e.code).send(developerErrorPage(`${e.code}: ${http.STATUS_CODES[e.code]}`, e.message, process.env.NODE_ENV === 'production' ? undefined : e.stack))
                } else {
                    this.logger.error(`HttpError was thrown, but there is already data sent!`);
                }
            } else {
                this.logger.error(e.stack);
                if (!wrappedMainStream.hasDataSent && !wrappedMainStream.res!.headersSent) {
                    wrappedMainStream.resHeaders = {};
                    wrappedMainStream.status(500).send(developerErrorPage('500: Internal Server Error', e.message, process.env.NODE_ENV === 'production' ? undefined : e.stack));
                }
            }
        }
    }

    /**
     * Handles HTTP/1.1 requests (both real and negotigated)
     * @param isSecure is request sent over http
     * @param req request stream
     * @param res response stream
     */
    private async requestHandler(isSecure: boolean, req: Http2ServerRequest, res: Http2ServerResponse) {
        const urlString = req.url as string || req.headers[http2.constants.HTTP2_HEADER_PATH] as string;
        let { pathname, searchParams } = new URL(urlString, 'base:');
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
                ctx.searchParams = searchParams;
                ctx.method = method as any;
                ctx.stream = wrappedMainStream;
                ctx.socket = undefined;
            });
            if (!wrappedMainStream.hasDataSent && !wrappedMainStream.res.headersSent) {
                wrappedMainStream.resHeaders = {};
                wrappedMainStream.status(404).send(developerErrorPage('404: Page Not Found', `Page not found at ${pathname}`, process.env.NODE_ENV === 'production' ? undefined : new Error('Reference stack').stack));
            }
        } catch (e) {
            if (e instanceof HttpError) {
                if (wrappedMainStream.canSendMoreData) {
                    wrappedMainStream.status(e.code).send(developerErrorPage(`${e.code}: ${http.STATUS_CODES[e.code]}`, e.message, process.env.NODE_ENV === 'production' ? undefined : e.stack))
                } else {
                    this.logger.error(`HttpError was thrown, but there is already data sent!`);
                }
            } else {
                this.logger.error(e.stack);
                if (!wrappedMainStream.hasDataSent && !wrappedMainStream.res.headersSent) {
                    wrappedMainStream.resHeaders = {};
                    wrappedMainStream.status(500).send(developerErrorPage('500: Internal Server Error', e.message, process.env.NODE_ENV === 'production' ? undefined : e.stack));
                }
            }
        }
    }

    /**
     * HTTP/1
     * @param request
     * @param socket
     * @param head
     */
    private async upgradeHandler(isSecure: boolean, request: IncomingMessage, socket: Socket, head: Buffer) {
        const headers = request.headers;
        const urlString = request.url;
        if (urlString === undefined) {
            socket.destroy();
            return;
        }
        let { pathname, searchParams } = new URL(urlString, 'base:');
        if (pathname === undefined) {
            socket.destroy();
            return;
        }
        pathname = path.normalize(pathname).replace(PATH_SEP_REGEXP, '/');
        const method = request.method;
        const upgradeType = headers[http2.constants.HTTP2_HEADER_UPGRADE];
        if (upgradeType === 'websocket' && method === 'GET') {
            this.wsServer!.handleUpgrade(request, socket, head, async (ws: WebSocket) => {
                const wrapperMainStream = new XpressRouterStream(headers, {});
                wrapperMainStream.isSecure = isSecure;
                wrapperMainStream.socket = ws;
                await this.route(pathname as string, ctx => {
                    ctx.searchParams = searchParams;
                    ctx.method = 'WS';
                    ctx.stream = wrapperMainStream;
                    ctx.socket = ws;
                });
                // Dirty check for handled websocket
                // Will break on WS update
                // https://github.com/websockets/ws/blob/master/lib/websocket.js#L384
                if (wrapperMainStream.socket.onmessage as any === wrapperMainStream.socket.onclose as any) {
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
    listenHttp(port: number, host?: string) {
        this.ensureWebSocketReady();
        let server = http.createServer();
        server.on('connection', this.requestHandler.bind(this, false))
        server.on('upgrade', this.upgradeHandler.bind(this, false));
        return new Promise((res, _rej) => {
            server.listen(port, host, () => {
                this.logger.debug('Listening (http) on %s:%d...', host, port);
                res(server);
            });
        });
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * bind()
     * This option is only for reverse proxy use, because browsers doesn't supports http/2 without tls
     * @param host host to bind on
     * @param port port to bind on
     */
    listenHttp2(port: number, host?: string) {
        this.ensureWebSocketReady();
        let server = http2.createServer();
        // There is no ALPN negotigation for HTTP/1 over TLS
        server.on('stream', this.streamHandler.bind(this, false));
        server.on('upgrade', this.upgradeHandler.bind(this, false));
        return new Promise((res, _rej) => {
            server.listen(port, host, () => {
                this.logger.debug('Listening (http) on %s:%d...', host, port);
                res(null);
            });
        });
    }

    wsServer?: WebSocket.Server;

    private ensureWebSocketReady() {
        if (this.wsServer) return;
        this.wsServer = new WebSocket.Server({ noServer: true });
    }
}
