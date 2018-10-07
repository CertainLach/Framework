"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("@meteor-it/fs");
const inferno_mobx_1 = require("inferno-mobx");
const inferno_server_1 = require("inferno-server");
const mobx_1 = require("mobx");
const preload_1 = require("./preload");
const http2_1 = require("http2");
const index_1 = require("../utils/index");
const path_1 = require("path");
const router_1 = require("packages/router");
const { HTTP2_HEADER_CONTENT_TYPE } = http2_1.constants;
class ServerMiddleware extends router_1.RoutingMiddleware {
    constructor(rocket, { compiledClientDir, compiledServerDir }) {
        super();
        this.cachedClientStats = null;
        this.cachedServerStats = null;
        this.rocket = rocket;
        this.compiledClientDir = compiledClientDir;
        this.compiledServerDir = compiledServerDir;
        inferno_mobx_1.useStaticRendering(true);
    }
    /**
     * @param ctx Typescript, wtf is wrong with you? TODO: Replace `ctx` with real typings
     * Note: Should be fixed by this: https://github.com/Microsoft/TypeScript/pull/8486/commits/2b5bbfee60e8f441856ae2dbfc9148e14050189b
     * But isn't fixed.
     */
    async handle(ctx) {
        // Should be called only on first page load or in SSR, if code isn't shit
        await preload_1.preloadAll();
        if (this.cachedClientStats === null || process.env.NODE_ENV === 'development') {
            this.cachedClientStats = JSON.parse((await fs_1.readFile(`${this.compiledClientDir}/stats.json`)).toString());
            this.cachedServerStats = JSON.parse((await fs_1.readFile(`${this.compiledServerDir}/stats.json`)).toString());
        }
        const { params, stream, query } = ctx;
        let files = this.cachedClientStats.assetsByChunkName.main;
        if (!Array.isArray(files))
            files = [files];
        let currentState = { drawTarget: null, store: null, redirectTarget: null };
        await this.rocket.router.route(`/${params['0']}`, ctx => {
            ctx.state = currentState;
            ctx.query = query;
        });
        // if (currentState.redirectTarget !== null) {
        //     stream.redirect(currentState.redirectTarget);
        //     return;
        // }
        let nWhenDevelopment = process.env.NODE_ENV === 'development' ? '\n' : '';
        let __html = `${nWhenDevelopment}${process.env.NODE_ENV === 'development' ? '<!-- == SERVER SIDE RENDERED HTML START == -->\n<div id="root">' : ''}${inferno_server_1.renderToString(currentState.drawTarget)}${process.env.NODE_ENV === 'development' ? '</div>\n<!-- === SERVER SIDE RENDERED HTML END === -->\n' : ''}`;
        let helmet = currentState.store.helmet;
        // Required code
        let neededEntryPointScripts = files.filter(e => !!e).filter(e => e.endsWith('.js'));
        // Loaded code (For preload on client), need to transform 
        // required modules to thier chunks on client
        // Server module id => Server module path => Client module id => Client chunk file 
        const serverModulePathList = currentState.store.helmet.ssrData.preloadModules.map(module => this.cachedServerStats.ssrData.moduleIdToPath[module]);
        const clientModuleIdList = serverModulePathList.filter(e => !!e).map(module => this.cachedClientStats.ssrData.modulePathToId[module]);
        const chunkList = [...new Set([].concat(...clientModuleIdList.filter(e => !!e).map(id => this.cachedClientStats.ssrData.moduleIdToChunkFile[id])).filter(chunk => neededEntryPointScripts.indexOf(chunk) === -1))];
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
        let safeStore = mobx_1.toJS(currentState.store, { exportMapsAsObjects: true, detectCycles: true });
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
            await index_1.asyncEach([...chunkList, ...neededEntryPointScripts], async (file) => {
                const ts = await stream.pushStream(`/${file}`);
                ts.resHeaders[HTTP2_HEADER_CONTENT_TYPE] = 'application/javascript; charset=utf-8';
                ts.sendFile(path_1.join(this.compiledClientDir, file));
            });
        }
        stream.resHeaders[HTTP2_HEADER_CONTENT_TYPE] = 'text/html; charset=utf-8';
        // Finally send rendered data to user
        stream.status(200).send(`<!DOCTYPE html>${nWhenDevelopment}${inferno_server_1.renderToStaticMarkup(<html {...helmet.htmlAttrs.props}>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
                <meta content="text/html;charset=utf-8" http-equiv="Content-Type"/>
                <meta content="utf-8" http-equiv="encoding"/>
                {helmet.meta.map(p => <meta {...p.props}/>)}
                {helmet.link.map(p => <link {...p.props}/>)}
                <title>{currentState.store.helmet.fullTitle}</title>
                {helmet.style.map(p => <style {...p.props} dangerouslySetInnerHTML={{ __html: p.body }}/>)}
                {currentState.store.isomorphicStyleLoader.styles.size > 0 ? <style dangerouslySetInnerHTML={{ __html: [...currentState.store.isomorphicStyleLoader.styles].join(nWhenDevelopment) }}/> : null}
            </head>
            <body {...helmet.bodyAttrs.props}>
                <div dangerouslySetInnerHTML={{ __html }}/>
                <script defer dangerouslySetInnerHTML={{ __html: stringStore }}/>
                {chunkList.map(f => <script defer src={`/${f}`}/>)}
                {neededEntryPointScripts.map(f => <script defer src={`/${f}`}/>)}
            </body>
        </html>)}${process.env.NODE_ENV === 'development' ? '\n<!--Meteor.Rocket is running in development mode!-->' : ''}`);
    }
}
exports.default = ServerMiddleware;
function initServer(rocket, { compiledClientDir, compiledServerDir }) {
    return async function (ctx) {
    };
}
exports.initServer = initServer;
//# sourceMappingURL=ServerMiddleware.jsx.map