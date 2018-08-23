import RocketStore from './RocketStore';
import RouterStore from './stores/RouterStore';
import HeaderStore from './stores/HeaderStore';
export declare type IRocketStoreInitializer = (context: any) => RocketStore;
export default class RocketApp {
    defaultSiteName: string;
    defaultPageName: string;
    constructor(defaultSiteName: string, defaultPageName: string, root: Element);
    storeInitializers: Array<[string, IRocketStoreInitializer]>;
    root: Element;
    attachStoreInitializer(name: string, initializer: IRocketStoreInitializer): void;
    initializeStores(isClientSide: boolean, prefillStores?: {
        [key: string]: any;
    }): Promise<{
        router?: RouterStore;
        header?: HeaderStore;
        [key: string]: RocketStore;
    }>;
    deinitializeStores(stores: {
        [key: string]: RocketStore;
    }): {
        [key: string]: RocketStore;
    };
    private commonRender(stores, history);
    private createServerHtml(app, dehydrated, asyncState);
    clientRender(to: Element, prefillStores?: {
        [key: string]: any;
    }): Promise<void>;
    serverRender(url: string, prefillStores?: {
        [key: string]: any;
    }, webpackStats?: any): Promise<string>;
}
