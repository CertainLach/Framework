import {readFile} from '@meteor-it/fs';
import {IRouterContext} from '@meteor-it/router';
import {XPressRouterContext} from '@meteor-it/xpress';
import {useStaticRendering} from 'mobx-react';
import {renderToStaticMarkup, renderToString} from 'react-dom/server';
import {toJS} from 'mobx';
import {preloadAll} from './preload';
import Rocket from './Rocket';
import {IRocketRouterState} from './router';
import {IDefaultStores, IUninitializedStoreMap} from './stores';
import {constants} from 'http2';
import {asyncEach} from "@meteor-it/utils";
import {join} from 'path';
import {format} from 'url';
import {stringify} from 'querystring';
import Router, {MultiMiddleware, RoutingMiddleware} from "../router/index";
import * as React from 'react';
import StaticMiddleware from "@meteor-it/xpress/middlewares/StaticMiddleware";

const {HTTP2_HEADER_CONTENT_TYPE, HTTP2_HEADER_LOCATION} = constants;

// Should be loaded only in development, parses stats file every time, so this middleware is very slow
class HotHelperMiddleware extends RoutingMiddleware<XPressRouterContext,void,'GET'>{
    compiledClientDir: string;
    constructor(compiledClientDir:string){
        super();
        this.compiledClientDir = compiledClientDir;
    }
    async handle({stream,path}:any): Promise<void> {
        if (!stream.hasDataSent&&path.endsWith('.hot.json')) {
            try{
                // Test if valid json (Webpack finished writing)
                const buf = (await readFile(`${this.compiledClientDir}${path}`)).toString();
                stream.status(200).send(JSON.parse(buf));
            }catch(e){
                await new Promise(res => setTimeout(res, 1000));
                stream.status(404).send('<error/>');
            }
        }
    }
}

// noinspection JSUnusedGlobalSymbols
export default class ServerMiddleware<SM extends IUninitializedStoreMap> extends MultiMiddleware {
    private readonly rocket: Rocket<SM>;
    private readonly compiledClientDir: string;
    private readonly compiledServerDir: string;
    private cachedClientStats: any = null;
    private cachedServerStats: any = null;

    constructor(rocket: Rocket<SM>, {compiledClientDir, compiledServerDir}: { compiledClientDir: string, compiledServerDir: string }) {
        super();
        this.rocket = rocket;
        this.compiledClientDir = compiledClientDir;
        this.compiledServerDir = compiledServerDir;
        this.staticMiddleware = new StaticMiddleware(compiledClientDir);
        useStaticRendering(true);
    }

    /**
     * @param ctx Typescript, wtf is wrong with you? TODO: Replace `ctx` with real typings
     * Note: Should be fixed by this: https://github.com/Microsoft/TypeScript/pull/8486/commits/2b5bbfee60e8f441856ae2dbfc9148e14050189b
     * But isn't fixed.
     */
    async handleRender(ctx: XPressRouterContext & IRouterContext<void>): Promise<void> {
        if (ctx.stream.hasDataSent)
            return;
        // Should be called only on first page load or in SSR, if code isn't shit
        await preloadAll();
        if (this.cachedClientStats === null || process.env.NODE_ENV === 'development') {
            this.cachedClientStats = JSON.parse((await readFile(`${this.compiledClientDir}/stats.json`)).toString());
            this.cachedServerStats = JSON.parse((await readFile(`${this.compiledServerDir}/stats.json`)).toString());
        }
        const {path, stream, query} = ctx;
        let files: string | string[] = this.cachedClientStats.assetsByChunkName.main;
        if (!Array.isArray(files))
            files = [files];
        let currentState: IRocketRouterState<IDefaultStores> = {drawTarget: null, store: null, redirectTarget: null};
        await this.rocket.router.route(path, ctx => {
            ctx.state = currentState as any;
            ctx.query = query;
        });

        let nWhenDevelopment = process.env.NODE_ENV === 'development' ? '\n' : '';
        let __html = `${nWhenDevelopment}${process.env.NODE_ENV === 'development' ? '<!-- == SERVER SIDE RENDERED HTML START == -->\n<div id="root">' : ''}${renderToString(currentState.drawTarget)}${process.env.NODE_ENV === 'development' ? '</div>\n<!-- === SERVER SIDE RENDERED HTML END === -->\n' : ''}`;
        // Allow redirects to be placed inside render() method
        if (currentState.store.router.hasRedirect) {
            stream.status(307);
            stream.resHeaders[HTTP2_HEADER_LOCATION] = format({
                pathname: currentState.store.router.path,
                search: stringify(currentState.store.router.query)
            });
            stream.respond();
            stream.res.end();
            return;
        }

        let helmet = currentState.store.helmet;

        // Required code
        let neededEntryPointScripts = files.filter(e => !!e).filter(e => e.endsWith('.js'));

        // Loaded code (For preload on client), need to transform 
        // required modules to thier chunks on client
        // Server module id => Server module path => Client module id => Client chunk file 
        const serverModulePathList = currentState.store.helmet.ssrData.preloadModules.map(module => this.cachedServerStats.ssrData.moduleIdToPath[module]);
        const clientModuleIdList = serverModulePathList.filter(e => !!e).map(module => this.cachedClientStats.ssrData.modulePathToId[module]);
        const chunkList = [...new Set([].concat(...clientModuleIdList.filter(e => !!e).map(id => this.cachedClientStats.ssrData.moduleIdToChunkFile[id])).filter(chunk => neededEntryPointScripts.indexOf(chunk) === -1))].filter(e => !!e && e !== '');

        // No need to render script on server, because:
        //  1. Script will be executed two times (After SSR, and on initial render (After readd))
        //  2. If main script isn't executed, then added script will also won't execute (NoScript)
        //  3. To prevent core monkeypatching (Antipattern)

        // Update unneeded ids for head
        {
            // Skip default meta
            let idx = 3;
            // Remove meta
            for (let i = idx; i < helmet.meta.length + helmet.link.length + idx; i++)
                helmet.ssrData.rht.push(i);
            // Skip removed + title
            idx += helmet.meta.length + helmet.link.length + 1;
            // Remove styles added by helmet
            for (let i = idx; i < helmet.style.length + idx; i++)
                helmet.ssrData.rht.push(i);
            // Skip removed
            idx += helmet.style.length;
            // Remove server added isomorphicStyleLoader styles
            if (currentState.store.isomorphicStyleLoader.styles.size > 0)
                for (let i = idx; i < idx + 1; i++)
                    helmet.ssrData.rht.push(i);
        }
        // Update unneeded ids for body
        {
            // Skip rendered root
            let idx = 1;
            // Remove stored store
            for (let i = idx; i < 1 + idx; i++)
                helmet.ssrData.rbt.push(i);
            // Skip store
            idx += 1;
            // Remove preloaded chunks
            for (let i = idx; i < chunkList.length + idx; i++)
                helmet.ssrData.rbt.push(i);
            // Skip preloaded chunks
            idx += chunkList.length;
            // Remove entry point scripts
            for (let i = idx; i < neededEntryPointScripts.length + idx; i++)
                helmet.ssrData.rbt.push(i);
        }

        // Stringify store for client, also cleanup store from unneeded data
        let safeStore = toJS(currentState.store, {exportMapsAsObjects: true, detectCycles: true});
        let stringStore = `${nWhenDevelopment}${process.env.NODE_ENV === 'development' ? '/* == STORE FOR CLIENT HYDRATION START == */\n' : ''}window.__SSR_STORE__=${JSON.stringify(safeStore, (key, value) => {
            if (value === safeStore.isomorphicStyleLoader)
                return undefined;
            if (value === safeStore.helmet.instances)
                return undefined;
            if (value === safeStore.helmet.ssrData.preloadModules)
                return undefined;
            return value;
        }, process.env.NODE_ENV === 'development' ? 4 : 0)};${nWhenDevelopment}${process.env.NODE_ENV === 'development' ? '/* === STORE FOR CLIENT HYDRATION END === */\n' : ''}`;

        if (stream.canPushStream) {
            await asyncEach([...chunkList, ...neededEntryPointScripts], async file => {
                const ts = await stream.pushStream(`/${file}`);
                ts.resHeaders[HTTP2_HEADER_CONTENT_TYPE] = 'application/javascript; charset=utf-8';
                ts.sendFile(join(this.compiledClientDir, file));
            });
        }
        stream.resHeaders[HTTP2_HEADER_CONTENT_TYPE] = 'text/html; charset=utf-8';
        // Finally send rendered data to user
        stream.status(200).send(`<!DOCTYPE html>${nWhenDevelopment}${renderToStaticMarkup(
            <html {...helmet.htmlAttrs.props}>
                <head>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                    <meta content="text/html;charset=utf-8" httpEquiv="Content-Type"/>
                    <meta content="utf-8" httpEquiv="encoding"/>
                    {helmet.meta.map((p,i) => <meta key={i} {...p.props} />)}
                    {helmet.link.map((p,i) => <link key={i} {...p.props} />)}
                    <title>{currentState.store.helmet.fullTitle}</title>
                    {helmet.style.map((p,i) => <style {...p.props} key={i} dangerouslySetInnerHTML={{__html: p.body}}/>)}
                    {currentState.store.isomorphicStyleLoader.styles.size > 0 ? <style
                        dangerouslySetInnerHTML={{__html: [...currentState.store.isomorphicStyleLoader.styles].join(nWhenDevelopment)}}/> : null}
                </head>
                <body {...helmet.bodyAttrs.props}>
                    <div dangerouslySetInnerHTML={{__html}}/>
                    <script defer dangerouslySetInnerHTML={{__html: stringStore}}/>
                    {chunkList.map((f,i) => <script defer key={i} src={`/${f}`}/>)}
                    {neededEntryPointScripts.map((f,i) => <script key={i} defer src={`/${f}`}/>)}
                </body>
            </html>)}${process.env.NODE_ENV === 'development' ? '\n<!--Meteor.Rocket is running in development mode!-->' : ''}`);
    }

    setupDone: boolean = false;
    staticMiddleware: StaticMiddleware;

    // Setup all routes
    setup(router: Router<XPressRouterContext & IRouterContext<void>, any, 'GET' | 'ALL'>, path: string | null): void {
        if(this.setupDone)throw new Error('ServerMiddleware isn\'t reusable! Create new to use in new xpress instance');
        router.on('GET',path,this.staticMiddleware);
        // Webpack, why?
        if(process.env.NODE_ENV==='development'){
            router.on('GET',path,new HotHelperMiddleware(this.compiledClientDir));
        }
        router.on('GET',path,async ctx=>await this.handleRender(ctx));
    }
}