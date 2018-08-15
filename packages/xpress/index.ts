import {createServer as createHttpsServer} from 'https';
import {METHODS,createServer as createHttpServer,IncomingMessage,ServerResponse} from 'http';
import {createSecureServer as createHttps2Server} from 'http2';
import {parse as parseUrl} from 'url';
import {parse as parseQuerystring} from 'querystring';
import AJSON from '@meteor-it/ajson';
import Logger from '@meteor-it/logger';
import {arrayKVObject, encodeHtmlSpecials} from '@meteor-it/utils';
import URouter from "../router";

const URL_START_REPLACER=/^\/+/;
const PATH_INDEX_SYM=Symbol('XPress#Request.middlewareIndex');
const TEMP_URL=Symbol('XPress#Request.currentUrl');
const POSSIBLE_EVENTS=[...METHODS,'ALL','WS'];
const MULTI_EVENTS={
    'ALL':[...METHODS.filter(e=>e!='OPTIONS'),'WS']
};

let xpressLogger=new Logger('xpress');

class XPressWrappedRequest{
    private realReq:IncomingMessage;
    params: {[key:string]:string};
    query: {[key:string]:string};
    url:string;
    path:string;
    constructor(req:IncomingMessage){
        this.realReq=req;
        this.url = req.url;
        let parsed=parseUrl(req.url);
        req.path=parsed.pathname;

        req.originalUrl=req.url;
        req.app=this;
        req.body=req.cookie=undefined;
        req.secure='https' == req.protocol;
        req.query=parseQuerystring(req.querystring=parsed.query);
    }
    setHeader(key:string,value:string){
        this.realReq.headers[key]=value;
    }
    getHeader(key:string){
        return this.realReq.headers[key];
    }
}

class XPRessWrappedResponse{
    private realRes:ServerResponse;
    constructor(res:ServerResponse){
        this.realRes=res;
    }
}

class XPressRouterContext<S> {
    req: XPressWrappedRequest;
    res: XPRessWrappedResponse;
    session: S;
    constructor(req:XPressWrappedRequest,res:XPRessWrappedResponse,session:S){
        this.req=req;
        this.res=res;
    }
}

/**
 * return (req:IncomingMessage,res:ServerResponse,next:(e?:Error)=>void)=>{
            this.once('beforeroute', (args, routing) => {
                args.request = req;
                args.response = res;
                args.params = (<any>req).params||{};
                args.next = () => { next() };
                routing.catch(next)
            });
            this.route(req.url);
        }
 */

class HttpError extends Error{
    code:number;

    constructor(code:number,message:string){
        super(message);
        this.code=code;
    }
}
let routerIndex=0;

export default class XPress<S> extends URouter<XPressRouterContext<S>>{
    server;
    logger;

    constructor(name){
        super(name);
        this.logger=new Logger(name);
    }
    addPossible(event){
        POSSIBLE_EVENTS.push(event.toUpperCase());
    }
    parseReqUrl(req){
        // Set
        let parsed=parseUrl(req.url);
        req.originalUrl=req.url;
        req.app=this;
        req.body=req.cookie=undefined;
        req.path=parsed.pathname;
        req.secure='https' == req.protocol;
        req.query=parseQuerystring(req.querystring=parsed.query);
    }
    populateReqHeader(req){
        // Express.JS methods
        req.set=(key,value)=>{
            req.setHeader(key,value);
            //return req;
        };
        req.get=(key)=>{
            return req.getHeader(key);
            //return req;
        };
        // reqRes.removeHeader; This is a part of original api
    }
    populateRequest(req){
        this.parseReqUrl(req);
        req.secure=req.protocol === 'https';
    }
    populateResHeader(res){
        res.header={};
        res.__getHeader=res.getHeader;
        res.__setHeader=res.setHeader;
        res.__removeHeader=res.removeHeader;
        res.set=(key,value)=>{
            this.logger.debug('Set header %s to %s',key,value);
            res.__setHeader(key,value);
            return res;
        };
        res.get=(key)=>{
            this.logger.debug('Get value of header %s',key);
            return res.__getHeader(key);
        };
        res.getHeader=(key)=>{
            return res.get(key);
        };
        res.setHeader=(key,value)=>{
            res.set(key,value);
        };
        res.removeHeader=(key)=>{
            res.__removeHeader(key);
        };
    }
    populateResponse(res){
        this.populateResHeader(res);
        res.__writeHead=res.writeHead;
        res.__end=res.end;
        res.sent=false;
        // TODO: Use primary closure
        res.writeHead=(...args)=>{
            return res.__writeHead(...args);
        };
        res.end=(...args)=>{
            // res.writeHead(res.statusCode?res.statusCode:200,res.header);
            return res.__end(...args);
        };
        res.status=(code)=>{
            res.statusCode=code;
            return res;
        };
        res.redirect=(url)=>{
            if(res.sent)
                throw new Error('Data is already sent!');
            res.sent=true;
            res.writeHead(307,{
                Location:url
            });
            res.end('307 Redirect to '+url);
        };
        res.send=(body)=>{
            if(res.sent)
                throw new Error('Data is already sent!');
            res.sent=true;
            // console.log(res.statusCode?res.statusCode:200);
            res.writeHead(res.statusCode?res.statusCode:200,res.headers);
            if(typeof body==='object'&&!(body instanceof Buffer))
                body=AJSON.stringify(body);
            res.end(body);
        };
    }
    httpHandler(req,res){
        // HTTP/HTTPS request handler
        // Populate request with data
        this.populateRequest(req);
        this.populateResponse(res);
        // Execute Router handler, the first in the handlers chain
        try{
            this.handle(req,res,err=>{
                if(res.sent)
                    return;
                // Next here = all routes ends, so thats = 404
                this.logger.warn('404 Page not found at '+req.originalUrl);
                // Allow only HttpError to be thrown
                if(!(err instanceof HttpError))
                    err=new HttpError(404,'Page not found: '+req.originalUrl);
                res.status(err.code||500).send(developerErrorPageHandler(err.code,err.message,err.stack));
            }, req.originalUrl);
        }catch(e){
            res.status(500).send(developerErrorPageHandler(e.code,e.message,e.stack));
        }
    }
    http2Handler(req,res){
        // HTTPS2 request handler
        // Populate request with data
        this.populateRequest(req);
        this.populateResponse(res);
        // Execute Router handler, the first in the handlers chain
        try{
            this.handle(req,res,err=>{
                // Next here = all routes ends, so thats = 404
                this.logger.warn('404 Page not found at '+req[TEMP_URL]);
                // Allow only HttpError to be thrown
                if(!(err instanceof HttpError))
                    err=new HttpError(404,'Page not found: '+encodeHtmlSpecials(req[TEMP_URL]));
                res.end(developerErrorPageHandler(err.code,err.message,err.stack));
            }, req.originalUrl);
        }catch(e){
            res.end(developerErrorPageHandler(e.code,e.message,e.stack));
        }
    }
    listenListeners=[];
    onListen(func){
        this.listenListeners.push(func);
    }
    listenHttp(host='0.0.0.0',port:number,silent=false){
        let httpServer=createHttpServer(this.httpHandler.bind(this));
        this.logger.debug('Before listening, executing listeners (to add support providers)...',this.listenListeners.length);
        this.listenListeners.forEach(listener=>{listener(httpServer,this)});
        this.logger.debug('Done adding %d support providers, listening...',this.listenListeners.length);
        return new Promise((res,rej)=>{
            httpServer.listen(port,host,()=>{
                if(!silent)
                    this.logger.log('Listening (http) on %s:%d...',host,port);
                res(httpServer);
            });
        });
    }
    listenHttp2(){
        throw new Error('browsers has no support for insecure http2, so listenHttp2() is deprecated');
    }
    listenHttps(host='0.0.0.0',port:number,certs,silent=false){
        let httpsServer=createHttpsServer(certs,this.httpHandler.bind(this));
        this.logger.debug('Before listening, executing listeners (to add support providers)...');
        this.listenListeners.forEach(listener=>{listener(httpsServer,this)});
        this.logger.debug('Done adding %d support providers, listening...',this.listenListeners.length);
        return new Promise((res,rej)=>{
            httpsServer.listen(port,host,()=>{
                if(!silent)
                    this.logger.log('Listening (https) on %s:%d...',host,port);
                res(httpsServer);
            });
        });
    }
    listenHttps2(host='0.0.0.0',port:number,certs,silent=false){
        let https2Server= createHttps2Server({...certs, allowHTTP1: true},this.http2Handler.bind(this));
        this.logger.debug('Before listening, executing listeners (to add support providers)...');
        this.listenListeners.forEach(listener=>{listener(https2Server,this)});
        this.logger.debug('Done adding %d support providers, listening...',this.listenListeners.length);
        return new Promise((res,rej)=>{
            https2Server.listen(port,host,()=>{
                if(!silent)
                    this.logger.log('Listening (https2) on %s:%d...',host,port);
                res(https2Server);
            });
        });
    }
}

function parsePath(path:string) {
    // We can use path-to-regexp, but why, if it is soo big module with a lot of dependencies?
    let result={
        regex:null,
        params:[],
        handlers:{}
    };
    path=path.replace(URL_START_REPLACER,'');
    let starCount=0;
    result.regex=new RegExp('^/'+path.split('/').map(part=>{
        if(part.indexOf(':')!==-1&&part.length>=1){
            result.params.push(part.substr(part.indexOf(':')+1));
            return part.substr(0,part.indexOf(':'))+'([^/]+)';
        }
        if(part==='*'){
            if(starCount===0){
                result.params.push('star');
                starCount++;
            }else{
                result.params.push('star_'+ ++starCount);
            }
            return '([^\/]+)';
        }
        if(part==='**'){
            if(starCount===0){
                result.params.push('star');
                starCount++;
            }else{
                result.params.push('star_'+ ++starCount);
            }
            return '(.+)';
        }
        if(part==='*?'){
            if(starCount===0){
                result.params.push('star');
                starCount++;
            }else{
                result.params.push('star_'+ ++starCount);
            }
            return '([^\/]*)';
        }
        if(part==='**?'){
            if(starCount===0){
                result.params.push('star');
                starCount++;
            }else{
                result.params.push('star_'+ ++starCount);
            }
            return '(.*)';
        }
        return part;
    }).join('/')+'$','');

    xpressLogger.debug('NEW PATH REGEX: '.blue+result.regex);
    return result;
}

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
	return `<html><head></head><body style='font-family:Arial,sans-serif;font-size:22px;color:#CCC;background:#222;padding:40px;'>${hello}<br/><br/><span style='color:#FC0;font-weight:600;'>${whatHappened}</span><br/><br/>${sorry}<br/><br/><span style='font-size: 14px;'>${post}</span></body></html>`;
}