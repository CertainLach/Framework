import {default as WebSocket, Server as WSServer} from '@discordjs/uws';
import Logger from '@meteor-it/logger';
import {encodeHtmlSpecials} from '@meteor-it/utils';
import URouter from "@meteor-it/router";
import {
    constants,
    createSecureServer,
    Http2ServerRequest,
    Http2ServerResponse,
    IncomingHttpHeaders,
    OutgoingHttpHeaders
} from 'http2';
import {createServer, IncomingMessage, ServerResponse} from 'http';
import {parse} from 'url';
import {normalize, sep as pathSep} from 'path';
import {Readable} from "stream";
import {Socket} from 'net';
import {createReadStream} from "fs";

const {
    HTTP2_HEADER_METHOD, HTTP2_HEADER_PATH, HTTP2_HEADER_STATUS,
    HTTP2_HEADER_CONTENT_TYPE, HTTP2_HEADER_LAST_MODIFIED,
    HTTP2_HEADER_CACHE_CONTROL, HTTP2_HEADER_CONTENT_LENGTH,
    HTTP2_HEADER_CONTENT_DISPOSITION, HTTP2_HEADER_UPGRADE,
    HTTP2_HEADER_ACCEPT_ENCODING, NGHTTP2_REFUSED_STREAM
} = constants;

let xpressLogger = new Logger('xpress');

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
        this.resHeaders[HTTP2_HEADER_STATUS] = status;
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
            createReadStream(path).pipe(this.res as unknown as ServerResponse);
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
                if (key !== HTTP2_HEADER_STATUS)
                    newHeaders[key] = this.resHeaders[key];
            }
            this.res.writeHead(this.resHeaders[HTTP2_HEADER_STATUS] as number || 200, newHeaders);
        }
    }

    acceptsEncoding(encoding: string) {
        return ((this.reqHeaders[HTTP2_HEADER_ACCEPT_ENCODING] as string || '').split(',').map(e => e.trim()).includes(encoding));
    }


    /**
     * Define multiplex point
     * @param path
     */
    pushStream(path: string): Promise<XpressRouterStream> {
        return new Promise((res, rej) => {
            if (!this.canPushStream) return rej(new Error("pushStream isn't supported for this session"));
            // @types/node sucks for http2
            this.res.stream.pushStream({...this.resHeaders, [HTTP2_HEADER_PATH]: path}, (err, stream, resHeaders) => {
                if (err) return rej(err);
                stream.on('error', (err) => {
                    const isRefusedStream = (err as any).code === 'ERR_HTTP2_STREAM_ERROR' &&
                        stream.rstCode === NGHTTP2_REFUSED_STREAM;
                    if (!isRefusedStream)
                        throw err;
                });

                const wrap = new XpressRouterStream(this.reqHeaders, {});
                wrap.res = {...this.res, stream} as any;
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
const PATH_SEP_REGEXP = new RegExp(`\\${pathSep}`, 'g');

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
    private async requestHandler(req: Http2ServerRequest, res: Http2ServerResponse) {
        const url = req.url as string || req.headers[HTTP2_HEADER_PATH] as string;
        let {pathname, query} = parse(url, true);
        if (pathname === undefined) {
            res.stream.destroy();
            return;
        }
        pathname = normalize(pathname).replace(PATH_SEP_REGEXP, '/');
        const method = req.method || req.headers[HTTP2_HEADER_METHOD];
        const wrappedMainStream = new XpressRouterStream(req.headers, {});
        wrappedMainStream.req = req;
        wrappedMainStream.res = res;
        try {
            await this.route(pathname, ctx => {
                ctx.query = query as { [key: string]: string };
                ctx.method = method as any;
                ctx.stream = wrappedMainStream;
            });
            if (!wrappedMainStream.hasDataSent && !wrappedMainStream.res.headersSent) {
                wrappedMainStream.resHeaders = {};
                wrappedMainStream.status(404).send(developerErrorPageHandler('404: Page Not Found', `Page not found at ${pathname}`, process.env.NODE_ENV === 'production' ? undefined : new Error('Reference stack').stack));
            }
        } catch (e) {
            this.logger.error(e.stack);
            if (!wrappedMainStream.hasDataSent && !wrappedMainStream.res.headersSent) {
                wrappedMainStream.resHeaders = {};
                wrappedMainStream.status(500).send(developerErrorPageHandler('500: Internal Server Error', e.message, process.env.NODE_ENV === 'production' ? undefined : e.stack));
            }
        }
    }

    /**
     * HTTP/2
     * (Fuck you, browsers, for not supporting HTTP/2 over TCP!)
     * @param stream
     * @param headers
     * @param flags
     */

    /*private async streamHandler(stream: ServerHttp2Stream, headers: IncomingHttpHeaders & IncomingHttpStatusHeader, flags: number) {
        const url = headers[HTTP2_HEADER_PATH] as string;
        let {pathname, query} = parse(url, true);
        if (pathname === undefined) {
            stream.end();
            return;
        }
        pathname = normalize(pathname).replace(PATH_SEP_REGEXP,'/');
        const method = headers[HTTP2_HEADER_METHOD] as any;
        const wrappedMainStream = new XpressRouterStream(headers, {});
        wrappedMainStream.stream=stream;
        try {
            await this.route(pathname, ctx => {
                ctx.query = query as { [key: string]: string };
                ctx.method = method;
                ctx.stream = wrappedMainStream;
            });
            if (!wrappedMainStream.hasDataSent) {
                wrappedMainStream.resHeaders = {};
                wrappedMainStream.status(404).send(developerErrorPageHandler('404: Page Not Found',`Page not found at ${pathname}`,process.env.NODE_ENV==='production'?undefined:new Error('Reference stack').stack));
            }
        }catch(e){
            wrappedMainStream.resHeaders = {};
            wrappedMainStream.status(500).send(developerErrorPageHandler('500: Internal Server Error',e.message,process.env.NODE_ENV==='production'?undefined:e.stack));
        }
    }*/

    /**
     * HTTP/1
     * @param request
     * @param socket
     * @param head
     */
    private async upgradeHandler(request: IncomingMessage, socket: Socket, head: ArrayBuffer) {
        const headers = request.headers;
        const url = request.url;
        if (url === undefined) {
            socket.destroy();
            return;
        }
        let {pathname, query} = parse(url, true);
        if (pathname === undefined) {
            socket.destroy();
            return;
        }
        pathname = normalize(pathname).replace(PATH_SEP_REGEXP, '/');
        const method = request.method;
        const upgradeType = headers[HTTP2_HEADER_UPGRADE];
        if (upgradeType === 'websocket' && method === 'GET') {
            this.wsServer.handleUpgrade(request, socket, head, async (ws) => {
                const wrapperMainStream = new XpressRouterStream(headers, {});
                wrapperMainStream.socket = ws;
                await this.route(pathname as string, ctx => {
                    ctx.query = query as { [key: string]: string };
                    ctx.method = 'WS';
                    ctx.stream = wrapperMainStream;
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
        let server = createServer(this.requestHandler.bind(this));
        // There is no ALPN negotigation for HTTP/1 over TLS D:
        // And, since HTTP/2 over tcp isn't supported in browsers,
        // Http server is only for HTTP/1.
        // TODO: Add option for listening HTTP/2 over TCP for reverse-proxy purposes
        // server.on('stream', this.streamHandler.bind(this));
        server.on('upgrade', this.upgradeHandler.bind(this));
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
    listenHttps(host = '0.0.0.0', port: number, {key, cert}: { key?: Buffer, cert?: Buffer }): Promise<void> {
        this.ensureWebSocketReady();
        let server = createSecureServer({
            key, cert,
            allowHTTP1: true
        }, this.requestHandler.bind(this));
        // server.on('stream', this.streamHandler.bind(this));
        server.on('upgrade', this.upgradeHandler.bind(this));
        return new Promise((res, rej) => {
            server.listen(port, host, () => {
                this.logger.debug('Listening (https) on %s:%d...', host, port);
                res();
            });
        });
    }

    wsServer: WSServer;

    private ensureWebSocketReady() {
        if (this.wsServer) return;
        this.wsServer = new WSServer({noServer: true});
    }
}

/**
 * Fancify error message for developer
 * @param title
 * @param desc
 * @param stack
 */
export function developerErrorPageHandler(title: string, desc: string, stack: string | undefined = undefined) {
    // Developer friendly
    if (title)
        title = encodeHtmlSpecials(title).replace(/\n/g, '<br>');
    if (desc)
        desc = encodeHtmlSpecials(desc).replace(/\n/g, '<br>');
    if (stack)
        stack = encodeHtmlSpecials(stack).replace(/\n/g, '<br>');
    return `<!DOCTYPE html><html><head><title>${title}</title></head><body><h1>${desc}</h1><hr>${stack ? `<code style="white-space:pre;">${stack}</code>` : ''}<hr><h2>uFramework xPress</h2></body></html>`;
}

// noinspection JSUnusedGlobalSymbols
/**
 * Fancify error message for user
 * @param hello
 * @param whatHappened
 * @param sorry
 * @param post
 */
export function userErrorPageHandler(hello: string, whatHappened: string, sorry: string, post: string) {
    // User friendly
    if (hello)
        hello = encodeHtmlSpecials(hello.replace(/\n/g, '<br>'));
    if (whatHappened)
        whatHappened = encodeHtmlSpecials(whatHappened.replace(/\n/g, '<br>'));
    if (sorry)
        sorry = encodeHtmlSpecials(sorry.replace(/\n/g, '<br>'));
    if (post)
        post = encodeHtmlSpecials(post.replace(/\n/g, '<br>'));
    return `<html><body style='font-family:Arial,sans-serif;font-size:22px;color:#CCC;background:#222;padding:40px;'>${hello}<br/><br/><span style='color:#FC0;font-weight:600;'>${whatHappened}</span><br/><br/>${sorry}<br/><br/><span style='font-size: 14px;'>${post}</span></body></html>`;
}
