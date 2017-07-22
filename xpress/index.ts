import {createServer as createHttpsServer} from 'https';
import {METHODS,createServer as createHttpServer} from 'http';
import {parse as parseUrl} from 'url';
import {parse as parseQuerystring} from 'querystring';

import * as toobusy from 'toobusy-js';
import {UWSServer} from 'uws';

import {encodeHtmlSpecials} from '@meteor-it/utils';
import AJSON from '@meteor-it/ajson';
import Logger from '@meteor-it/logger';

import {router} from './nextRouter';

export default class XPress{
    server;
    logger;
    options={};
    configured=false;

    constructor(name){
        this.logger=new Logger(name);
    }

    r(defineRoutes){
        if(!this.configured)
            throw new Error('configure must be called before route definition!');
        return router(defineRoutes,this.options);
    }

    populateReqRes(req,res){
        // REQ URL
        if(req){
            let parsed=parseUrl(req.url);
            req.originalUrl=req.url;
            req.app=this;
            req.body=req.cookie=undefined;
            req.path=parsed.pathname;
            req.secure='https' === req.protocol;
            req.query=parseQuerystring(req.querystring=parsed.query);
        }
        // RES Helpers
        if(res){
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
                res.writeHead(res.statusCode?res.statusCode:200,res.headers);
                if(typeof body==='object')
                    body=AJSON.stringify(body);
                res.end(body);
            };
            res.json=(body)=>{
                res.writeHead(res.statusCode?res.statusCode:200,res.headers);
                body=AJSON.stringify(body);
                res.end(body);
            };
        }
    }
    listenListeners=[];
    onListen(func){
        if(func.length!==3)
            throw new Error('Wrong listen listener signature! (Excepted (nativeServer,routeHandler,xpress)=>{})');
        this.listenListeners.push(func);
    }
    configure(options){
        this.configured=true;
        if (!options.notFoundHandler){
            this.logger.warn('options.notFoundHandler is not defined! Defining it for you!');
            options.notFoundHandler = (req,res)=>{
                res.status(404).send(developerErrorPageHandler('404 - Page not found','Page not found'));
            };
        }
        if (options.notFoundHandler.length!==2)
            throw new Error('options.notFoundHandler has wrong signature! (Excepted (req,res)=>{})');
        if (!options.errorHandler){
            this.logger.warn('options.errorHandler is not defined!');
            options.notFoundHandler = (req,res)=>{
                res.status(404).send(developerErrorPageHandler('404','Page not found'));
            };
        }
        if (options.errorHandler.length!==3)
            throw new Error('options.errorHandler has wrong signature! (Excepted (err,req,res)=>{})');
        if (!options.redirectHandler){
            this.logger.warn('options.redirectHandler is not defined!');
            options.redirectHandler = (res,url,status)=>{
                res.status(status).redirect(url);
            };
        }
        if (options.redirectHandler.length!==3)
            throw new Error('options.redirectHandler has wrong signature! (Excepted (res,url,status)=>{})');
        Object.assign(this.options,options);
        options.r=this.r.bind(this);
    }
    patchServer(server){
        server._close=server.close;
        server.close=()=>new Promise(res=>server._close(res));
    }
    listenHttp(host='0.0.0.0',port,routeHandler){
        if(!routeHandler)
            throw new Error('No routeHandler is defined!');

        let httpServer=createHttpServer((req,res)=>{
            this.populateReqRes(req,res);
            routeHandler(req,res);
        });

        this.logger.log('Before listening, executing listeners (to add support providers)...');
        this.listenListeners.forEach(listener=>{listener(httpServer,routeHandler,this)});
        this.logger.log('Done adding %d support providers, listening...',this.listenListeners.length);
        return new Promise((res,rej)=>{
            httpServer.listen(port,host,()=>{
                this.logger.log('Listening (http) on %s:%d...',host,port);
                this.patchServer(httpServer);
                res(httpServer);
            });
        });
    }
    listenHttps(host='0.0.0.0',port,certs,routeHandler){
        if(!routeHandler)
            throw new Error('No routeHandler is defined!');

        let httpsServer=createHttpsServer(certs,(req,res)=>{
            this.populateReqRes(req,res);
            routeHandler(req,res);
        });

        this.logger.log('Before listening, executing listeners (to add support providers)...');
        this.listenListeners.forEach(listener=>{listener(httpsServer,routeHandler,this)});
        this.logger.log('Done adding %d support providers, listening...',this.listenListeners.length);
        return new Promise((res,rej)=>{
            httpsServer.listen(port,host,()=>{
                this.logger.log('Listening (https) on %s:%d...',host,port);
                this.patchServer(httpsServer);
                res(httpsServer);
            });
        });
    }
}

export function developerErrorPageHandler (title, desc, stack = undefined) {
    // Developer friendly
    if(title)
        title=encodeHtmlSpecials(title.replace(/\n/g, '<br>'));
    if(desc)
        desc=encodeHtmlSpecials(desc.replace(/\n/g, '<br>'));
    if(stack)
        stack=encodeHtmlSpecials(stack.replace(/\n/g, '<br>'));
	return `<!DOCTYPE html><html><head><title>${title}</title></head><body><h1>${desc}</h1><hr>${stack?`<code>${stack}</code>`:''}<hr><h2>uFramework xPress</h2></body></html>`;
}

export function userErrorPageHandler (hello, whatHappened, sorry, post) {
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