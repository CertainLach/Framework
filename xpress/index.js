import {createServer as createHttpsServer} from 'https';
import {METHODS,createServer as createHttpServer} from 'http';
import {parse as parseUrl} from 'url';
import {parse as parseQuerystring} from 'querystring';

import {Server} from 'uws';

import Logger from '@meteor-it/logger';
import {arrayKVObject} from '@meteor-it/utils';

const URL_START_REPLACER=/^\/+/;
const PATH_INDEX_SYM=Symbol('XPress#Request.middlewareIndex');
const POSSIBLE_EVENTS=[...METHODS,'ALL','WS'];
const MULTI_EVENTS={
    'ALL':METHODS.filter(e=>e!='OPTIONS')
};

let xpressLogger=new Logger('xpress');
let directLowLevelCallingWarned=false;

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
            throw new Error('Invalid handler method! Possible methods: \n   (req,res,next)=>{...} \n   (req,res)=>{...}');
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
        let props=[];
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
            props=this.middlewares[currentMiddlewareIndex].props;
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
        req.props=arrayKVObject(props,matched.slice(1));
        found(req,res,nextCb);
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
        // Set req.rawUrl, req.url, req.query, req.querystring and req.originalUrl
        let parsed=parseUrl(req.rawUrl=req.url);
        req.originalUrl=req.url=parsed.pathname;
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
        res.set=(key,value)=>{
            res.header[key]=value;
            //return res;
        };
        res.get=(key)=>{
            return res.header[key];
        };
        res.removeHeader=(key)=>{
            delete res.header[key];
        };
    }
    populateResponse(res){
        this.populateResHeader(res);
        res._writeHead=res.writeHead;
        res._end=res.end;
        res.sent=false;
        // TODO: Use primary closure
        res.writeHead=(...args)=>{
            if(!directLowLevelCallingWarned){
                this.logger.warn('Direct call to writeHead detected, make sure you know what are you doing');
                directLowLevelCallingWarned=true;
            }
            return res._writeHead(...args);
        };
        res.end=(...args)=>{
            if(!directLowLevelCallingWarned){
                this.logger.warn('Direct call to writeHead detected, make sure you know what are you doing');
                directLowLevelCallingWarned=true;
            }
            return res._end(...args);
        };
        res.status=(code)=>{
            res.statusCode=code;
        };
        res.redirect=(url)=>{
            if(res.sent)
                throw new Error('Data is already sent!');
            res.sent=true;
            res._writeHead(307,{
                Location:url,
            });
            res._end('307 Redirect to '+url);
        };
        res.send=(body)=>{
            if(res.sent)
                throw new Error('Data is already sent!');
            res.sent=true;
            res._writeHead(res.statusCode?res.statusCode:200,res.header);
            res._end(body);
        };
    }
    httpHandler(req,res){
        // HTTP/HTTPS request handler
        // Populate request with data
        this.populateRequest(req);
        this.populateResponse(res);
        // Execute Router handler, the first in the handlers chain
        this.handle(req,res,err=>{
            // Next here = all routes ends, so thats = 404
            this.logger.warn('404 Page not found at '+req.url);
            // Allow only HttpError to be thrown
            if(!(err instanceof HttpError))
                err=new HttpError(404,'Page not found: '+escapeHtml(req.url));
            // TODO: status, content type
            res.end(getErrorPage(err.code,err.message,process.env.ENV==='development'?err.stack:undefined));
        }, req.originalUrl);
    }
    wsHandler(socket){
        // Websocket request handler, acts similar to httpHandler()
        // TODO: Provide own req object, instead of upgradeReq
        this.parseReqUrl(socket.upgradeReq);
        socket.upgradeReq.method='WS'; // Because upgrade req is a get
        // Socket will be transfered over handlers chain as http response 
        this.handle(socket.upgradeReq,socket,err=>{
            // No handlers? Close socket. 404 as in http
            if(process.env.ENV==='development')
                socket.close(404,err?err.stack:new Error('next() called, but no next handlers are found').stack);
            else
                socket.close();
            this.logger.warn('404 Socket url not found at '+socket.upgradeReq.url);
            // Handle any error here
            if(err instanceof Error)
                // We can throw there, but then error will be filled with http internals
                // So, just log
                this.logger.error(err);
            else if(err!==undefined)
                // String/something other thrown? I dont like that...
                // But anyway, lets log them
                this.logger.error(new Error(err));
        }, socket.upgradeReq.originalUrl);
    }
    listenHttp(host='0.0.0.0',port,silent=false){
        let httpServer=createHttpServer(this.httpHandler.bind(this));
        const ws = new Server({server: httpServer});
        ws.on('connection', this.wsHandler.bind(this));
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
        const wss = new Server({server: httpsServer});
        wss.on('connection', this.wsHandler.bind(this));
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
let doubleStarUnsafeWarned=false;
let questionUnsafeWarned=false;
function escapeHtml(r) {
    return r.replace(/[\x26\x0A\x3c\x3e\x22\x27]/g, r=> "&#" + r.charCodeAt(0) + ";");
}

function parsePath(path) {
    // We can use path-to-regexp, but why, if it is soo big module with a lot of dependencies?
    let result={
        regex:null,
        props:[],
        handlers:{}
    };
    path=path.replace(URL_START_REPLACER,'');
    let starCount=0;
    result.regex=new RegExp('^/'+path.split('/').map(part=>{
        if(part.indexOf(':')!==-1&&part.length>=1){
            result.props.push(part.substr(part.indexOf(':')+1));
            return part.substr(0,part.indexOf(':'))+'([^/]+)';
        }
        if(part==='*'){
            if(starCount===0){
                result.props.push('star');
                starCount++;
            }else{
                result.props.push('star_'+ ++starCount);
            }
            return '([^\/]+)';
        }
        if(part==='**'){
            if(!doubleStarUnsafeWarned){
                xpressLogger.warn('Double star in pathes are possible security risc!\nMake sure you know what are u doing!');
                doubleStarUnsafeWarned=true;
            }
            if(starCount===0){
                result.props.push('star');
                starCount++;
            }else{
                result.props.push('star_'+ ++starCount);
            }
            return '(.+)';
        }
        if(part==='*?'){
            if(!questionUnsafeWarned){
                xpressLogger.warn('Question in pathes are possible security risc!\nMake sure you know what are u doing!');
                questionUnsafeWarned=true;
            }
            if(starCount===0){
                result.props.push('star');
                starCount++;
            }else{
                result.props.push('star_'+ ++starCount);
            }
            return '([^\/]*)';
        }
        if(part==='**?'){
            if(!questionUnsafeWarned){
                xpressLogger.warn('Question in pathes are possible security risc!\nMake sure you know what are u doing!');
                questionUnsafeWarned=true;
            }
            if(!doubleStarUnsafeWarned){
                xpressLogger.warn('Double star in pathes are possible security risc!\nMake sure you know what are u doing!');
                doubleStarUnsafeWarned=true;
            }
            if(starCount===0){
                result.props.push('star');
                starCount++;
            }else{
                result.props.push('star_'+ ++starCount);
            }
            return '(.*)';
        }
        return part;
    }).join('/')+'$','');
    
    xpressLogger.debug('NEW PATH REGEX: '.blue+result.regex);
    return result;
}