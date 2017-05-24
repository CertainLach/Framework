import {createServer as createHttpsServer} from 'https';
import {METHODS,createServer as createHttpServer} from 'http';
import {parse as parseUrl} from 'url';
import {parse as parseQuerystring} from 'querystring';
import AJSON from '@meteor-it/ajson';

import Logger from '@meteor-it/logger';
import {arrayKVObject} from '@meteor-it/utils-common';

const URL_START_REPLACER=/^\/+/;
const PATH_INDEX_SYM=Symbol('XPress#Request.middlewareIndex');
const TEMP_URL=Symbol('XPress#Request.currentUrl');
const POSSIBLE_EVENTS=[...METHODS,'ALL'];
const MULTI_EVENTS={
    'ALL':METHODS.filter(e=>e!='OPTIONS')
};

let xpressLogger=new Logger('xpress');

class HttpError extends Error{
    code;
    
    constructor(code,message){
        super(message);
        this.code=code;
    }
}
let routerIndex=0;
export class Router{
    middlewares=[];
    routeIndexKey=Symbol('XPress#Request.middlewareIndex(Router#'+(routerIndex++)+')');
    constructor(name){
        this.logger=new Logger(name);
    }
    use(handler){
        this.on('GET /**?',handler);
    }
    //event===GET /, WS /*
    on(eventString,handler){
        let [event,path,...middlewares]=eventString.split(' ');
        if(middlewares.length!==0)
            throw new Error('Middlewares work in progress! Remove thrid parameter from .on()');
        if(event.toUpperCase()!==event){
            this.logger.warn('Upper case is preffered for event names! (Got: %s)',event);
            event=event.toUpperCase();
        }
        if(!~POSSIBLE_EVENTS.indexOf(event)){
            throw new Error('Unknown event: '+event+', possible events are '+POSSIBLE_EVENTS.join(', ')+'!');
        }
        let middleware=parsePath(path);
        let nhandler=handler;
        if(handler instanceof Router){
            if(path.indexOf('**')!==-1)
                throw new Error('Can\'t attach router handle to double-star path! (Got: '+path+')');
            if(!path.endsWith('/*'))
                this.logger.warn('Seems like you forgot about /* at end of your router path. (Got: %s)',path);
            nhandler=(req,res,next)=>{
                this.logger.debug('Router handler url[before] = %s',req.originalUrl);
                let slicedUrl='/'+req.originalUrl.split('/').slice(path.split('/').length-1).join('/');
                this.logger.debug('Router handler url[after] = %s',slicedUrl);
                return handler.handle(req,res,next,slicedUrl);
            };
        }
        if(nhandler.length!==2&&nhandler.length!==3)
            this.logger.warn('Possible invalid handler method! Possible methods: \n   (req,res,next)=>{...} \n   (req,res)=>{...}\nBut passed handler accepts %d arguments!',nhandler.length);
        if(MULTI_EVENTS[event])
            for(let cEvent of MULTI_EVENTS[event])
                middleware.handlers[cEvent]=nhandler;
        else
            middleware.handlers[event]=nhandler;
        this.middlewares.push(middleware);
    }
    handle(req,res,next,fakeUrl){
        this.logger.debug('handle(%s %s)',req.method.toUpperCase(),fakeUrl||req.originalUrl);
        if(!req[this.routeIndexKey])
            req[this.routeIndexKey]=0;
        if(req[this.routeIndexKey]>this.middlewares.length)
            next();
        let nextCb=(data)=>{
            if(data)
                throw new Error('next() is called with data, it is unsupported currently! Use req object to save data for next routes');
            this.logger.debug('next()');
            req[this.routeIndexKey]++;
            this.handle(req,res,next,fakeUrl);
        };
        let matched=null; // regex.match result
        let params=[];
        let found=null; // handle() function for method
        let currentMiddlewareIndex=req[this.routeIndexKey]; // Quick access
        while(!found){
            this.logger.debug('Searching middleware... %d',currentMiddlewareIndex);
            if(!this.middlewares[currentMiddlewareIndex]){
                // End of middleware list
                // currentMiddlewareIndex++;
                this.logger.debug('End of middleware list');
                break;
            }
            if(!this.middlewares[currentMiddlewareIndex].handlers[req.method]){
                // No such method on this middleware
                currentMiddlewareIndex++;
                this.logger.debug('No method on middleware');
                continue;
            }
            if(!(matched=(fakeUrl||req.originalUrl).match(this.middlewares[currentMiddlewareIndex].regex))){
                // Url regex doesn't match
                currentMiddlewareIndex++;
                this.logger.debug('URL doesn\'t matched: ',matched,fakeUrl||req.originalUrl,this.middlewares[currentMiddlewareIndex-1].regex);
                continue;
            }
            // Found middleware
            found=this.middlewares[currentMiddlewareIndex].handlers[req.method];
            params=this.middlewares[currentMiddlewareIndex].params;
            // Dont match again, since we already have matches assigned to 'matched'
            //matched=(fakeUrl||req.originalUrl).match(this.middlewares[currentMiddlewareIndex]);
        }
        this.logger.debug('Index: %d, found: %s',currentMiddlewareIndex,!!found);
        req[this.routeIndexKey]=currentMiddlewareIndex; // Restore key
        if(found===null){
            // Not found, exit from this router and go to next (or to XPress route handle)
            next();
            return;
        }
        // Found handler, gogogo!
        req.params=arrayKVObject(params,matched.slice(1));
        try{
            found(req,res,nextCb);
        }catch(e){
            res.end(getErrorPage(500,'Internal Server Error: '+e.message,process.env.ENV==='development'?e.stack:undefined));
        }
        //this.middlewares[req[this.routeIndexKey]].handle(req,res,nextCb);
    }
}
export default class XPress extends Router{
    server;
    logger;
    
    constructor(name){
        super(name);
        this.logger=new Logger(name);
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
    }
    populateResHeader(res){
        res.header={};
        res.__getHeader=res.getHeader;
        res.__setHeader=res.setHeader;
        res.__removeHeader=res.removeHeader;
        res.set=(key,value)=>{
            this.logger.debug('Set header %s to %s',key,value);
            res.__setHeader(key,value);
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
            //res.writeHead(res.statusCode?res.statusCode:200,res.header);
            return res.__end(...args);
        };
        res.status=(code)=>{
            res.statusCode=code;
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
            res.writeHead(res.statusCode?res.statusCode:200,res.headers);
            if(typeof body==='object')
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
                // Next here = all routes ends, so thats = 404
                this.logger.warn('404 Page not found at '+req[TEMP_URL]);
                // Allow only HttpError to be thrown
                if(!(err instanceof HttpError))
                    err=new HttpError(404,'Page not found: '+escapeHtml(req[TEMP_URL]));
                // TODO: status, content type
                res.end(getErrorPage(err.code,err.message,process.env.ENV==='development'?err.stack:undefined));
            }, req.originalUrl);
        }catch(e){
            res.end(getErrorPage(500,'Internal Server Error: '+e.message,process.env.ENV==='development'?e.stack:undefined));
        }
    }
    listenListeners=[];
    onListen(func){
        this.listenListeners.push(func);
    }
    addPossible(event){
        if(POSSIBLE_EVENTS.indexOf(event)+1)
            return;
        POSSIBLE_EVENTS.push(event);
    }
    listenHttp(host='0.0.0.0',port,silent=false){
        let httpServer=createHttpServer(this.httpHandler.bind(this));
        this.logger.log('Before listening, executing listeners (to add support providers)...');
        this.listenListeners.forEach(listener=>{listener(httpServer,this)});
        this.logger.log('Done adding %d support providers, listening...',this.listenListeners.length);
        return new Promise((res,rej)=>{
            httpServer.listen(port,host,()=>{
                if(!silent)
                    this.logger.log('Listening (http) on %s:%d...',host,port);
                res(httpServer);
            }); 
        });
    }
    listenHttps(host='0.0.0.0',port,certs,silent=false){
        let httpsServer=createHttpsServer(certs,this.httpHandler.bind(this));
        this.logger.log('Before listening, executing listeners (to add support providers)...');
        this.listenListeners.forEach(listener=>{listener(httpsServer,this)});
        this.logger.log('Done adding %d support providers, listening...',this.listenListeners.length);
        return new Promise((res,rej)=>{
            httpsServer.listen(port,host,()=>{
                if(!silent)
                    this.logger.log('Listening (https) on %s:%d...',host,port);
                res();
            }); 
        });
    }
}

METHODS.map(m=>m.toLowerCase()).forEach(m=>XPress.prototype[m]=function(url,handler){this.on(m.toUpperCase()+' '+url,handler)});

function getErrorPage (title,desc, stack = undefined) {
    // Minimalistic error page, as in express.js
	return `<!DOCTYPE html><html><head><title>${title}</title></head><body><h1>${desc}</h1><hr>${stack ? `<code>${stack.replace(/\n/g, '<br>')}</code>` : ''}<hr><h2>uFramework xPress</h2></body></html>`;
}
function escapeHtml(r) {
    return r.replace(/[\x26\x0A\x3c\x3e\x22\x27]/g, r=> "&#" + r.charCodeAt(0) + ";");
}

function parsePath(path) {
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