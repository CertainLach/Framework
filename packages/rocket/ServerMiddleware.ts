import { readFile } from '@meteor-it/fs';
import Router, { IRouterContext, MultiMiddleware, RoutingMiddleware } from "@meteor-it/router";
import { asyncEach, isBrowserEnvironment } from "@meteor-it/utils";
import { StaticMiddleware, XPressRouterContext } from '@meteor-it/xpress';
import * as http2 from 'http2';
import { toJS } from 'mobx';
import { useStaticRendering } from "mobx-react-lite";
import * as querystring from 'querystring';
import { ReactElement } from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import * as url from 'url';
import { h } from './h';
import HelmetStore from "./helmet/HelmetStore";
import PreloadStore from './preload/PreloadStore';
import { preloadAll } from './preload/TO_PRELOAD';
import Rocket from './Rocket';
import { IRocketRouterState } from './router';
import RouterStore from "./router/RouterStore";
import { createOrDehydrateStore } from "./stores/useStore";
import IsomorphicStyleLoaderStore from "./style/IsomorphicStyleLoaderStore";

// Should be loaded only in development, parses stats file every time, so this middleware is very slow
class HotHelperMiddleware extends RoutingMiddleware<XPressRouterContext, void, 'GET'>{
    compiledClientDir: string;
    constructor(compiledClientDir: string) {
        super();
        this.compiledClientDir = compiledClientDir;
    }
    async handle({ stream, path }: any): Promise<void> {
        if (!stream.hasDataSent && path.endsWith('.hot.json')) {
            try {
                // Test if valid json (Webpack finished writing)
                const buf = (await readFile(`${this.compiledClientDir}${path}`)).toString();
                stream.status(200).send(JSON.parse(buf));
            } catch (e) {
                await new Promise(res => setTimeout(res, 1000));
                stream.status(404).send('<error/>');
            }
        }
    }
}

// noinspection JSUnusedGlobalSymbols
export default class ServerMiddleware extends MultiMiddleware {
    private readonly compiledClientDir?: string;
    private readonly compiledServerDir?: string;
    private cachedClientStats?: any = null;
    private cachedServerStats?: any = null;
    private statsLoaded: boolean = false;
    private commentString?: string;

    constructor(public rocket: Rocket, { compiledClientDir, compiledServerDir, commentString }: { compiledClientDir?: string, compiledServerDir?: string, commentString?: string }) {
        super();
        this.compiledClientDir = compiledClientDir;
        this.compiledServerDir = compiledServerDir;
        this.commentString = commentString;
        if (compiledClientDir) {
            this.staticMiddleware = new StaticMiddleware(compiledClientDir, { filter: /^(?!(?:report\.html|stats.json))/ });
            if (process.env.NODE_ENV === 'production')
                this.staticMiddleware.prepareCache();
        }
        useStaticRendering(true);
    }

    /**
     * @param ctx context, on which page will be rendered
     */
    private async handleRender(ctx: XPressRouterContext & IRouterContext<void>): Promise<void> {
        if (ctx.stream.hasDataSent) return;

        // Should do something only on first page load or in SSR, if code isn't shit
        await preloadAll();
        if (!this.statsLoaded || process.env.NODE_ENV === 'development') {
            this.statsLoaded = true;
            if (this.compiledClientDir)
                this.cachedClientStats = JSON.parse((await readFile(`${this.compiledClientDir}/stats.json`)).toString());
            if (this.compiledServerDir)
                this.cachedServerStats = JSON.parse((await readFile(`${this.compiledServerDir}/stats.json`)).toString());
        }
        if (!this.compiledClientDir && !this.compiledServerDir)
            throw new Error('At least one needed side is required');

        let nWhenDevelopment = process.env.NODE_ENV === 'development' ? '\n' : '';

        const { path: pathStr, stream, query } = ctx;
        let files: string | string[] = this.cachedClientStats.assetsByChunkName.main;
        if (!Array.isArray(files))
            files = [files];

        if (!this.compiledServerDir) {
            // Different routine for only-client rendering
            stream.status(200).send(`<!DOCTYPE html>${nWhenDevelopment}${renderToStaticMarkup(
                h('html', [h([
                    h('head', [
                        h('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }),
                        h('meta', { content: 'text/html;charset=utf-8', httpEquiv: 'Content-Type' }),
                        h('meta', { content: 'utf-8', httpEquiv: 'Encoding' })
                    ]),
                    h('body', [
                        h('div', process.env.NODE_ENV === 'development' ? [h('div', { id: 'root' })] : []),
                        files.filter(e => e.endsWith('.js')).map((f, key) => h('script', { key, defer: true, src: `/${f}` }))
                    ])
                ])]) as ReactElement<any>)}${process.env.NODE_ENV === 'development' ? '\n<!--Meteor.Rocket is running in development mode!-->' : ''}${this.commentString ? `\n${this.commentString}` : ''}`);
            return;
        }
        let currentState: IRocketRouterState = { store: {} };
        const routerStore = createOrDehydrateStore(currentState.store, RouterStore);
        await this.rocket.router.route(pathStr, ctx => {
            ctx.state = currentState;
            routerStore.setDataNoRerender(pathStr, query);
            ctx.query = query;
        });

        // Execute every useAsync
        const preloadStore = createOrDehydrateStore(currentState.store, PreloadStore);
        do {
            renderToStaticMarkup(currentState.drawTarget as ReactElement<any>);
            await preloadStore.resolveAll();
        } while (preloadStore.countOfResolvedLastRender !== 0);

        // Generate rendered client html
        let __html = `${nWhenDevelopment}${process.env.NODE_ENV === 'development' ? '<!-- == SERVER SIDE RENDERED HTML START == -->\n<div id="root">' : ''}${renderToString(currentState.drawTarget as ReactElement<any>)}${process.env.NODE_ENV === 'development' ? '</div>\n<!-- === SERVER SIDE RENDERED HTML END === -->\n' : ''}${this.commentString ? `\n${this.commentString}` : ''}`;

        // Allow redirects to be placed inside render() method
        if (routerStore.hasRedirect) {
            stream.status(307);
            stream.resHeaders[http2.constants.HTTP2_HEADER_LOCATION] = url.format({
                pathname: routerStore.path,
                search: querystring.stringify(routerStore.query)
            });
            stream.respond();
            stream.res.end();
            return;
        }

        //
        const helmetStore = createOrDehydrateStore(currentState.store, HelmetStore);

        // Required code
        let neededEntryPointScripts = files.filter(e => !!e).filter(e => e.endsWith('.js'));

        // Loaded code (For preload on client), need to transform
        // required modules to thier chunks on client
        // Server module id => Server module path => Client module id => Client chunk file
        const serverModulePathList = helmetStore.ssrData.preloadModules.map(module => this.cachedServerStats.ssrData.moduleIdToPath[module]);
        const clientModuleIdList = serverModulePathList.filter(e => !!e).map(module => this.cachedClientStats.ssrData.modulePathToId[module]);
        const chunkList = [...new Set([].concat(...clientModuleIdList.filter(e => !!e).map(id => this.cachedClientStats.ssrData.moduleIdToChunkFile[id])).filter(chunk => neededEntryPointScripts.indexOf(chunk) === -1))].filter(e => !!e && e !== '');

        //
        const isomorphicStyleLoaderStore = createOrDehydrateStore(currentState.store, IsomorphicStyleLoaderStore);

        // No need to render script on server, because:
        //  1. Script will be executed two times (After SSR, and on initial render (After readd))
        //  2. If main script isn't executed, then added script will also won't execute (NoScript)
        //  3. To prevent core monkeypatching (Antipattern)

        if (this.compiledClientDir) {
            // Update unneeded ids for head
            {
                // Skip default meta
                let idx = 3;
                // Remove meta
                for (let i = idx; i < helmetStore.meta.length + helmetStore.link.length + idx; i++)
                    helmetStore.ssrData.rht.push(i);
                // Skip removed + title
                idx += helmetStore.meta.length + helmetStore.link.length + 1;
                // Remove styles added by helmet
                for (let i = idx; i < helmetStore.style.length + idx; i++)
                    helmetStore.ssrData.rht.push(i);
                // Skip removed
                idx += helmetStore.style.length;
                // Remove server added isomorphicStyleLoader styles
                if (isomorphicStyleLoaderStore.styles.size > 0)
                    for (let i = idx; i < idx + 1; i++)
                        helmetStore.ssrData.rht.push(i);
            }
            // Update unneeded ids for body
            {
                // Skip rendered root
                let idx = 1;
                // Remove stored store
                for (let i = idx; i < 1 + idx; i++)
                    helmetStore.ssrData.rbt.push(i);
                // Skip store
                idx += 1;
                // Remove preloaded chunks
                for (let i = idx; i < chunkList.length + idx; i++)
                    helmetStore.ssrData.rbt.push(i);
                // Skip preloaded chunks
                idx += chunkList.length;
                // Remove entry point scripts
                for (let i = idx; i < neededEntryPointScripts.length + idx; i++)
                    helmetStore.ssrData.rbt.push(i);
            }
        }

        let stringStore = '';

        if (this.compiledClientDir) {
            // Stringify store for client, also cleanup store from unneeded data
            let safeStore: any = toJS(currentState.store, { exportMapsAsObjects: true, detectCycles: true });
            // Remove data which are not used on client rendering
            stringStore = `${nWhenDevelopment}${process.env.NODE_ENV === 'development' ? '/* == STORE FOR CLIENT HYDRATION START == */\n' : ''}window.__SSR_STORE__=${JSON.stringify(safeStore, (_key, value) => {
                if (value === safeStore[IsomorphicStyleLoaderStore.id] || value === safeStore[HelmetStore.id].instances || value === safeStore[HelmetStore.id].ssrData.preloadModules)
                    return undefined;
                return value;
            }, process.env.NODE_ENV === 'development' ? 4 : 0)};${nWhenDevelopment}${process.env.NODE_ENV === 'development' ? '/* === STORE FOR CLIENT HYDRATION END === */\n' : ''}`;
        }

        // HTTP2 server push
        if (this.compiledClientDir && stream.canPushStream) {
            await asyncEach([...chunkList, ...neededEntryPointScripts], async (file: string) => {
                const ts = await stream.pushStream(`/${file}`);
                await this.staticMiddleware!.serve(file, ts);
            });
        }

        // Other files are handled by StaticMiddleware
        stream.resHeaders[http2.constants.HTTP2_HEADER_CONTENT_TYPE] = 'text/html; charset=utf-8';

        // TODO: Full spec
        // https://www.w3.org/TR/preload/#dfn-preload-keyword
        let availableForLink = helmetStore.link.filter(e => !!e.props.href);
        if (availableForLink.length !== 0)
            stream.resHeaders[http2.constants.HTTP2_HEADER_LINK] = availableForLink.map(l => `<${l.props.href}>; rel="${l.props.rel}"`).join(', ');

        // Finally send rendered data to user
        stream.status(200).send(`<!DOCTYPE html>${nWhenDevelopment}${renderToStaticMarkup(
            h('html', Object.assign({}, ...helmetStore.htmlAttrs.map(e => e.props)), [h([
                h('head', [
                    h('meta', { name: 'viewport', content: 'width=device-width, initial-scale=1.0' }),
                    h('meta', { content: 'text/html;charset=utf-8', httpEquiv: 'Content-Type' }),
                    h('meta', { content: 'utf-8', httpEquiv: 'Encoding' }),
                    helmetStore.meta.map((p, key) => h('meta', { key, ...p.props })),
                    helmetStore.link.map((p, key) => h('link', { key, ...p.props })),
                    h('title', [helmetStore.fullTitle]),
                    helmetStore.style.map((p, key) => h('style', { key, dangerouslySetInnerHTML: { __html: p.body }, ...p.props })),
                    isomorphicStyleLoaderStore.styles.size > 0 && h('style', { dangerouslySetInnerHTML: { __html: [...isomorphicStyleLoaderStore.styles].join(nWhenDevelopment) } })
                ]),
                h('body', Object.assign({}, ...helmetStore.bodyAttrs.map(e => e.props)), [
                    h('div', { dangerouslySetInnerHTML: { __html } }),
                    this.compiledClientDir && h('script', { defer: true, dangerouslySetInnerHTML: { __html: stringStore } }),
                    this.compiledClientDir && chunkList.map((f, key) => h('script', { key, defer: true, src: `/${f}` })),
                    this.compiledClientDir && neededEntryPointScripts.map((f, key) => h('script', { key, defer: true, src: `/${f}` }))
                ])
            ])]) as ReactElement<any>)}${process.env.NODE_ENV === 'development' ? '\n<!--Meteor.Rocket is running in development mode!-->' : ''}`);
        // }
    }

    setupDone: boolean = false;
    staticMiddleware?: StaticMiddleware;

    // Setup all routes
    setup(router: Router<XPressRouterContext & IRouterContext<void>, any, 'GET' | 'ALL'>, path: string | null): void {
        if (isBrowserEnvironment()) throw new Error('WTF are u doing?');
        if (this.setupDone) throw new Error('ServerMiddleware isn\'t reusable! Create new to use in new xpress instance');
        this.setupDone = true;
        if (this.staticMiddleware)
            router.on('GET', path, this.staticMiddleware);
        // Webpack, why?
        if (this.compiledClientDir && process.env.NODE_ENV === 'development') {
            router.on('GET', path, new HotHelperMiddleware(this.compiledClientDir));
        }
        router.on('GET', path, async ctx => await this.handleRender(ctx));
    }
}
