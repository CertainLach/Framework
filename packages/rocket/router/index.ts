import Router from '@meteor-it/router';
import { configure } from 'mobx';
import Logger from '@meteor-it/logger';
import Store from "../stores/store";
import RouterStore from "./RouterStore";
import {RocketStoreContext} from '../stores';
import {createOrDehydrateStore} from "../stores";
import {h} from "../h";

export type IRocketRouterContext = {
    query: { [key: string]: string }
};
export type IRocketRouterState = {
    drawTarget: JSX.Element | null,
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

configure({
    enforceActions: 'never',
    isolateGlobalState: true
});

const logger = new Logger('Rocket.Router');

let browserSavedStore:{[key:string]:Store}|null = null;
export function getInitialRouter<S>(stateGetter: () => IRocketRouterState): Router<IRocketRouterContext, IRocketRouterState, IRocketRouterMethodList> {
    const appRouter = new Router<IRocketRouterContext, IRocketRouterState, IRocketRouterMethodList>(stateGetter);
    // All of initial tree setup must be here
    appRouter.on('ALL', null, async ({ state, next, resolve, path, query }:any) => {
        let proceedStore = state.store;
        const routerStore:RouterStore = createOrDehydrateStore(proceedStore,RouterStore);
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
        state.drawTarget = h(RocketStoreContext.Provider,proceedStore as any,[state.drawTarget]);
    });
    return appRouter;
}