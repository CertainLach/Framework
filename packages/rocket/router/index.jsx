"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const router_1 = require("@meteor-it/router");
const mobx_1 = require("mobx");
const stores_1 = require("../stores");
const inferno_mobx_1 = require("inferno-mobx");
const logger_1 = require("@meteor-it/logger");
/**
 * Helper function that supports merging maps
 * @param target
 * @param source
 */
function mergeObservables(target, source) {
    if (!source) {
        return;
    }
    else {
        Object.keys(source).forEach(key => {
            if (typeof target[key] === 'object') {
                if (mobx_1.isObservableMap(target[key]))
                    return target[key].merge(source[key]);
                if (mobx_1.isObservableArray(target[key]))
                    return target[key].replace(source[key]);
                target[key] = source[key];
            }
            else {
                target[key] = source[key];
            }
        });
    }
}
class InternalRedirectThrowable extends Error {
    constructor(url) {
        super('this is not really a error');
        this.url = url;
    }
}
exports.InternalRedirectThrowable = InternalRedirectThrowable;
mobx_1.configure({
    enforceActions: 'never',
    isolateGlobalState: true
});
const logger = new logger_1.default('Rocket.Router');
let browserSavedStore = null;
function getInitialRouter(stateGetter, store) {
    const appRouter = new router_1.default(stateGetter);
    // All of initial tree setup must be here
    appRouter.on('ALL', null, async ({ state, next, resolve, path, query }) => {
        let proceedStore = null;
        if (process.env.BROWSER) {
            if (browserSavedStore === null) {
                browserSavedStore = await stores_1.initStores(store);
                if (process.env.NODE_ENV !== 'development') {
                    let ssrStores = window.__SSR_STORE__;
                    if (ssrStores) {
                        // Clean up
                        delete window.__SSR_STORE__;
                        for (let key in ssrStores)
                            if (ssrStores.hasOwnProperty(key))
                                mergeObservables(browserSavedStore[key], ssrStores[key]);
                    }
                }
                else {
                    window.__STORE__ = browserSavedStore;
                }
            }
            proceedStore = browserSavedStore;
        }
        else {
            proceedStore = await stores_1.initStores(store);
        }
        proceedStore.router.path = path;
        proceedStore.router.query = query;
        state.store = proceedStore;
        try {
            await next();
        }
        catch (e) {
            if (e instanceof InternalRedirectThrowable) {
                state.redirectTarget = e.url;
                resolve(null);
            }
            else {
                logger.err('Failed to render something after processing routing');
                logger.err(e.stack);
                // TODO: Display error somehow?
            }
            return;
        }
        state.drawTarget = (<inferno_mobx_1.Provider {...state.store}>
                {(state.drawTarget)}
            </inferno_mobx_1.Provider>);
    });
    return appRouter;
}
exports.getInitialRouter = getInitialRouter;
//# sourceMappingURL=index.jsx.map