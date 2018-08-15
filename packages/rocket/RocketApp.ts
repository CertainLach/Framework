import RocketStore from './RocketStore';
import RocketComponent from './RocketComponent';
import RouterStore from './stores/RouterStore';
import HeaderStore from './stores/HeaderStore';
import {Component} from 'react';
import {useStaticRendering} from 'mobx-react';
import createMemoryHistory from 'history/createMemoryHistory'
import {Router} from 'react-router';
import {Provider} from './mobx';
import {r} from './r';
import ReactDOM from 'react-dom/server'
import ReactDOMClient from 'react-dom';
import createBrowserHistory from 'history/createBrowserHistory'
import { AsyncComponentProvider, createAsyncContext } from 'react-async-component'
import asyncBootstrapper from 'react-async-bootstrapper';
import serialize from 'serialize-javascript';
import { create, persist } from './mobx';

type HTML5Location = any;
type HTML5History = any;
declare var process:any;

export type IRocketStoreInitializer=(context:any)=>RocketStore;

export default class RocketApp {
    defaultSiteName:string;
    defaultPageName:string;
    constructor(defaultSiteName:string,defaultPageName:string,root:Element){
        this.defaultSiteName=defaultSiteName;
        this.defaultPageName=defaultPageName;
        this.root=root;
    }
    storeInitializers: Array<[string,IRocketStoreInitializer]>=[];
    root: Element;
    attachStoreInitializer(name:string,initializer:IRocketStoreInitializer){
        this.storeInitializers.push([name,initializer]);
    }

    async initializeStores(isClientSide:boolean,prefillStores:{[key:string]:any}={}):Promise<{router?: RouterStore,header?: HeaderStore,[key:string]: RocketStore}>{
        let fullStore:{[key:string]:RocketStore}={};
        let rehydrate = null;
        if(isClientSide)
            rehydrate=create({});
        for(let [name,initializer] of this.storeInitializers){
            let store=initializer(fullStore);
            store.setSide(isClientSide);
            if(!prefillStores[name])
                prefillStores[name]={};
            store.rehydrate(prefillStores[name]);
            if(isClientSide)
                await rehydrate(store.constructor.name,store);
            store.storeName=name;
            fullStore[name]=store;
        }
        return fullStore;
    }
    deinitializeStores(stores:{[key:string]:RocketStore}){
        let fullDehydrate:{[key:string]:RocketStore}={};
        Object.keys(stores).forEach((name) => {
            let store=stores[name];
            let dehydrated=store.dehydrate();
            if(store.dehydrationRequired)
                fullDehydrate[name]=dehydrated;
        });
        return fullDehydrate;
    }

    private commonRender(stores:{[key:string]:RocketStore},history:HTML5History){
        return r(<any>Provider,stores,
            r(Router,{
                history
            },this.root)
        );
    }
    private createServerHtml(app:string,dehydrated:any,asyncState:any){
        const metatags=dehydrated.header.metaTags.map((tag:{[key:string]:string})=>`<meta ${(Object.keys(tag).map(tagName=>`${tagName}="${encodeURIComponent(tag[tagName])}"`).join(' ')).trim()}></meta>`)
        const head=`<title>${dehydrated.header.siteName} - ${dehydrated.header.pageName}</title><meta charset='utf-8'></meta><meta name="description" content="${encodeURIComponent(dehydrated.header.description)}"></meta><meta name="viewport" content="width=device-width, initial-scale=1.0"></meta><meta name="keywords" content="${encodeURIComponent(dehydrated.header.keywords.join(' '))}"></meta>${metatags}<link href="main.client.css" rel="stylesheet">`;
        const storeJson=`<script type="text/javascript">window.__SERVER_STORE__=${JSON.stringify(dehydrated)}</script>`;
        const asyncStoreJson=`<script type="text/javascript">window.__PRERENDER_STORE__=${asyncState}</script>`;
        const scripts=`<script type="text/javascript" src="/bootstrap.client.js"></script><script type="text/javascript" src="/main.client.js"></script>`;
        return `<!doctype html><html><head>${head}</head><body><div id="root">${app}</div>${storeJson}${asyncStoreJson}${scripts}</body></html>`;
        // return `<!doctype html><html><head>${head}${styles?styles.toString().replace(/\r?\n/g,''):''}</head><body><div id="root">${app}</div>${storeJson}${cssHash?cssHash.toString().replace(/\r?\n/g,''):''}${js?js.toString().replace(/\r?\n/g,''):''}</body></html>`;
    }

    async clientRender(to:Element,prefillStores:{[key:string]:any}={}){
        let stores=await this.initializeStores(true,prefillStores);
        stores.header=new HeaderStore(this.defaultSiteName,this.defaultPageName);
        stores.header.setSide(true);
        stores.header.rehydrate(prefillStores.header);
        let history=createBrowserHistory();
        stores.router=new RouterStore(history);
        stores.router.setSide(true);
        stores.router.rehydrate({});
        // (<any>window).stores=stores;
        // console.log(stores.app.partsSearchInput);
        let rendered=this.commonRender(stores,history);
        if(process.env.ENV==='development')
            ReactDOMClient.render(rendered,to);
        else
            ReactDOMClient.hydrate(rendered,to)
    }

    async serverRender(url:string,prefillStores:{[key:string]:any}={},webpackStats?:any){
        useStaticRendering(true);
        let stores=await this.initializeStores(false,prefillStores);
        stores.header=new HeaderStore(this.defaultSiteName,this.defaultPageName);
        stores.header.setSide(false);
        stores.header.rehydrate({});
        let history=createMemoryHistory({
            initialEntries: [ url ],
            initialIndex: 0,
            keyLength: 6,
            getUserConfirmation: null
          });
        stores.router=new RouterStore(history);
        stores.router.setSide(false);
        stores.router.rehydrate({});
        const asyncContext=createAsyncContext();
        let rendered=r(AsyncComponentProvider,{asyncContext},
            this.commonRender(stores,history)
        );


        // console.log(asyncContext);
        await asyncBootstrapper(rendered);
        const asyncState = serialize(asyncContext.getState());
        // console.log(asyncState);


        let app = ReactDOM.renderToString(rendered);
        if(process.env.ENV==='development')
            app='';
        let dehydrated=this.deinitializeStores(stores);
        let html=this.createServerHtml(app,dehydrated,asyncState);
        useStaticRendering(false);
        return html;
    }
}