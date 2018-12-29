import Router from '@meteor-it/router';
import Logger from '@meteor-it/logger';
import Store from "../stores/store";
import RouterStore from "./RouterStore";
import { RocketStoreContext } from '../stores';
import { createOrDehydrateStore } from "../stores";
import { h } from "../h";
import { ReactNode } from 'react';

export type IRocketRouterContext = {
    query: { [key: string]: string }
};
export type IRocketRouterState = {
    drawTarget: ReactNode | null,
    redirectTarget: string,
    store: {}
};
export type IRocketRouterMethodList = any;

export class InternalRedirectThrowable extends Error {
    url: string;
    constructor(url: string) {
        super('this is not really a error');
        this.url = url;
    }
}

const logger = new Logger('Rocket.Router');

let browserSavedStore: { [key: string]: Store } | null = null;
export function getInitialRouter<S>(stateGetter: () => IRocketRouterState): Router<IRocketRouterContext, IRocketRouterState, IRocketRouterMethodList> {
    const appRouter = new Router<IRocketRouterContext, IRocketRouterState, IRocketRouterMethodList>(stateGetter);
    // All of initial tree setup must be here
    appRouter.on('ALL', null, async ({ state, next, resolve, path, query }: any) => {
        let proceedStore = state.store;
        if (proceedStore === null) throw new Error('state.store is null, incorrect use of getInitialRouter()');
        const routerStore: RouterStore = createOrDehydrateStore(proceedStore, RouterStore);
        try {
            await next();
        } catch (e) {
            if (e instanceof InternalRedirectThrowable) {
                state.redirectTarget = e.url;
                resolve(null);
            } else {
                logger.err('Failed to render something after processing routing');
                logger.err(e.stack);
                // TODO: Display error somehow?
            }
            return;
        }
        state.drawTarget = h(RocketStoreContext.Provider, { value: proceedStore }, [state.drawTarget]);
    });
    return appRouter;
}
