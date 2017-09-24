import Logger from '@meteor-it/logger';
export declare class HardPluginLoader {
    logger: any;
    name: any;
    folder: any;
    constructor(name: any, folder: any);
    load(): Promise<any>;
}
export declare class SoftPluginLoader {
    logger: any;
    name: any;
    folder: any;
    watcher: any;
    autoData: any;
    plugins: any[];
    constructor(name: any, folder: any);
    load(data: any): Promise<any[]>;
    findPluginAtPath(pluginPath: any): any[];
    unloadPlugin(pluginPath: any): Promise<void>;
    loadPlugin(pluginPath: any): any;
    validatePlugin(plugin: any): void;
    callInit(plugin: any): Promise<void>;
    onChange(pluginPath: any): Promise<void>;
    watcherReady: boolean;
    onAdd(pluginPath: any): Promise<void>;
    onRemove(pluginPath: any): Promise<void>;
    watch(): Promise<void>;
}
export declare class WebpackPluginLoader {
    plugins: any[];
    acceptor: any;
    logger: Logger;
    requireContextGetter: any;
    pluginContext: any;
    constructor(name: any, requireContextGetter: any, acceptor: any);
    customReloadLogic(key: any, module: any, reloaded: any): Promise<void>;
    load(pluginContext: any): Promise<any[]>;
}
declare global  {
    interface NodeModule {
        hot: any;
    }
}
