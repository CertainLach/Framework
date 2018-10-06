import Router from '@meteor-it/router'
import { IUninitializedStoreMap, IInitializedStoreMap } from './stores';
import { IRocketRouterContext, IRocketRouterState, IRocketRouterMethodList, getInitialRouter } from './router';

export default class Rocket<SM extends IUninitializedStoreMap>{
    private storeMap: SM;
    constructor(storeMap: SM) {
        this.storeMap = storeMap;
        this.initRouter();
    }
    router: Router<IRocketRouterContext, IRocketRouterState<IInitializedStoreMap<SM>>, IRocketRouterMethodList>;
    private initRouter() {
        this.router = getInitialRouter(() => ({
            drawTarget: null,
            store: null,
            redirectTarget: null
        }), this.storeMap)
    }
}