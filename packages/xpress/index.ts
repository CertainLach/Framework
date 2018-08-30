import {createServer as createHttpServer,IncomingMessage,ServerResponse} from 'http';
import {Server as WSServer,default as WebSocket} from 'uws';
import {parse as parseUrl} from 'url';
import {parse as parseQuerystring} from 'querystring';
import AJSON from '@meteor-it/ajson';
import Logger from '@meteor-it/logger';
import {encodeHtmlSpecials} from '@meteor-it/utils';
import URouter from "@meteor-it/router";
import {IRouterContext} from "../router";

let xpressLogger=new Logger('xpress');

export type IIncomingMessageExtension<T=any> = {
    query:{[key:string]:any};
    headers:{[key:string]:string};

    route:any;

    app:XPress<T>;
    baseUrl:string;
    body:any;
    cookies:any;
    signedCookies:any;
    fresh:boolean;
    stale:boolean;
    hostname:string;
    ip:string;
    ips:string[];
    method:string;
    originalUrl:string;
    path:string;
    protocol:string;
    secure:boolean;
    subdomains:string[];
    xhr:boolean;

    get:(key:string)=>string;
};
export type IServerResponseExtension<T=any> = {
    sent:boolean;

    set:(key:string,value:string)=>void;
    status:(status:number)=>ServerResponse&IServerResponseExtension<T>;
    redirect:(url:string)=>void;
    send:(data:string|Buffer|any)=>void;
};
export class XPressRouterContext {
    req: IncomingMessage&IIncomingMessageExtension;
    res: ServerResponse&IServerResponseExtension;
    query: {[key:string]:string};
    socket: WebSocket;
    constructor(req:IncomingMessage&IIncomingMessageExtension,res:ServerResponse&IServerResponseExtension){
        this.req=req;
        this.res=res;
    }
}

/**
 * Throw this error if you want to customize XPress error message
 * (By default, all thrown errors are displayed as 500 Internal Server Error)
 */
class HttpError extends Error{
    code:number;

    constructor(code:number,message:string){
        super(message);
        this.code=code;
    }
}

/**
 * Routing helper to pass default XPress context
 * Read docs of URouter
 */
// noinspection JSUnusedGlobalSymbols
export class Router<S> extends URouter<XPressRouterContext,S>{
    constructor(defaultState:(()=>S)|null=null){
        super(defaultState);
    }
}

/**
 * XPress web server API
 */
export default class XPress<S> extends URouter<XPressRouterContext,S>{
    logger:Logger;

    constructor(name:string|Logger,defaultState:(()=>S)|null=null){
        super(defaultState);
        if(name instanceof Logger)
            this.logger=name;
        else
            this.logger=new Logger(name);
    }

    /**
     * Internal, make req/res look like express.js ones
     * @param req
     * @param res
     */
    private populateReqRes(req:IncomingMessage&IIncomingMessageExtension,res:ServerResponse&IServerResponseExtension){
        if(req!==null) {
            let parsed = parseUrl(req.url, false);
            req.originalUrl = req.url;
            req.app = this;
            req.body = req.cookies = undefined;
            req.path = parsed.pathname;
            req.secure = 'https' == req.protocol;
            req.query = parseQuerystring(parsed.query);
            req.get = (key: string) => (req.headers[key.toLowerCase()]);
        }
        if(res!==null) {
            res.set = (key: string, value: string) => res.setHeader(key, value);
            res.sent = false;
            res.status = (code: number) => {
                res.statusCode = code;
                return res;
            };
            (res as any).__write = res.write;
            (res as any).write = function (...args: any[]) {
                res.sent = true;
                return ((res as any).__write as any)(...args);
            };
            (res as any).__end = res.end;
            (res as any).end = function (...args: any[]) {
                res.sent = true;
                return ((res as any).__end as any)(...args);
            };
            res.send = (body: string | Buffer | any) => {
                if (res.sent) throw new Error('Data is already sent!');
                res.sent = true;
                if (typeof body === 'object' && !(body instanceof Buffer)) {
                    body = AJSON.stringify(body);
                    res.set('content-type', 'application/json');
                }
                res.writeHead(res.statusCode ? res.statusCode : 200, res.getHeaders());
                res.end(body, () => {
                });
            };
            res.redirect = (url: string) => {
                if (res.sent) throw new Error('Data is already sent!');
                res.sent = true;
                res.writeHead(307, {
                    Location: url
                });
                res.end('307 Redirect to ' + url);
            };
        }
    }

    /**
     * Internal
     * @param req
     * @param res
     */
    private async httpHandler(req:IncomingMessage&IIncomingMessageExtension,res:ServerResponse&IServerResponseExtension){
        // HTTP/HTTPS request handler
        // Populate request with data
        this.populateReqRes(req,res);
        // Execute Router handler, the first in the handlers chain
        const next=(e?:any)=>{
            if(res.sent)
                return;
            if(e){
                if(e instanceof HttpError) {
                    res.status(e.code).send(developerErrorPageHandler(`${e.code} ${e.message}`, e.message, e.stack));
                }else {
                    res.status(500).send(developerErrorPageHandler('500 Internal Server Error', e.message, e.stack));
                    this.logger.error(`Internal server error at ${req.method} ${req.path}`);
                    this.logger.error(e.stack);
                }
            }else{
                res.status(404).send(developerErrorPageHandler('404 Page Not Found','Page not found',new Error('Reference stack').stack));
                this.logger.warn(`Page not found at ${req.method} ${req.path}`);
            }
        };
        try{
            await (this as URouter).route(req.path,(ctx:IRouterContext<S>&XPressRouterContext) => {
                ctx.method = req.method as any;
                ctx.query = req.query;
                ctx.req = req;
                ctx.res = res;
                ctx.next = ()=>{next()};
            });
            next();
        }catch(e){
            next(e);
        }
    }

    /**
     * Internal
     * @param socket
     */
    private async wsHandler(socket:WebSocket){
        // Websocket request handler, acts similar to httpHandler()
        let req:IncomingMessage&IIncomingMessageExtension=socket.upgradeReq as IncomingMessage&IIncomingMessageExtension;
        this.populateReqRes(req,null);
        const next=(e?:any)=>{
            if(e){
                if(e instanceof HttpError) {
                    // Nothing?
                    socket.close(e.code);
                }else {
                    this.logger.error(`Internal server error at WS ${req.path}`);
                    this.logger.error(e.stack);
                    socket.close(500);
                }
            }else{
                // TODO: Dirty check, but how to handle not handled socket?
                // internalOnMessage/internalOnClose is undocummented fields
                if((socket as any).internalOnMessage.name==='noop'&&(socket as any).internalOnClose.name==='noop') {
                    this.logger.warn(`Page not found at WS ${req.path}`);
                    socket.close(404);
                }
            }
        };
        try{
            await (this as URouter).route(req.path,(ctx:IRouterContext<S>&XPressRouterContext) => {
                ctx.method='WS';
                ctx.query = req.query;
                ctx.req=req;
                ctx.socket=socket;
                ctx.next=()=>{next()}
            });
        }catch(e){
            next(e);
        }
    }

    /**
     * bind()
     * @param host host to bind on
     * @param port port to bind on
     */
    // noinspection JSUnusedGlobalSymbols
    listenHttp(host='0.0.0.0',port:number):Promise<void>{
        let server=createHttpServer(this.httpHandler.bind(this));
        const ws = new WSServer({
            server
        });
        ws.on('connection',this.wsHandler.bind(this));
        return new Promise((res,rej)=>{
            server.listen(port,host,()=>{
                this.logger.debug('Listening (http) on %s:%d...',host,port);
                res();
            });
        });
    }
}

/**
 * Fancify error message for developer
 * @param title
 * @param desc
 * @param stack
 */
export function developerErrorPageHandler (title:string, desc:string, stack:string|undefined = undefined) {
    // Developer friendly
    if(title)
        title=encodeHtmlSpecials(title).replace(/\n/g, '<br>');
    if(desc)
        desc=encodeHtmlSpecials(desc).replace(/\n/g, '<br>');
    if(stack)
        stack=encodeHtmlSpecials(stack).replace(/\n/g, '<br>');
	return `<!DOCTYPE html><html><head><title>${title}</title></head><body><h1>${desc}</h1><hr>${stack?`<code style="white-space:pre;">${stack}</code>`:''}<hr><h2>uFramework xPress</h2></body></html>`;
}

/**
 * Fancify error message for user
 * @param hello
 * @param whatHappened
 * @param sorry
 * @param post
 */
// noinspection JSUnusedGlobalSymbols
export function userErrorPageHandler (hello:string, whatHappened:string, sorry:string, post:string) {
    // User friendly
    if(hello)
        hello=encodeHtmlSpecials(hello.replace(/\n/g, '<br>'));
    if(whatHappened)
        whatHappened=encodeHtmlSpecials(whatHappened.replace(/\n/g, '<br>'));
    if(sorry)
        sorry=encodeHtmlSpecials(sorry.replace(/\n/g, '<br>'));
    if(post)
        post=encodeHtmlSpecials(post.replace(/\n/g, '<br>'));
	return `<html><body style='font-family:Arial,sans-serif;font-size:22px;color:#CCC;background:#222;padding:40px;'>${hello}<br/><br/><span style='color:#FC0;font-weight:600;'>${whatHappened}</span><br/><br/>${sorry}<br/><br/><span style='font-size: 14px;'>${post}</span></body></html>`;
}
