///<reference types="webpack-env" />

import Logger from '@meteor-it/logger';
import IPlugin from './IPlugin';
import { QueueProcessor } from '@meteor-it/queue';

type Module = __WebpackModuleApi.Module;
type RequireContext = __WebpackModuleApi.RequireContext;

type IAcceptor = (acceptor: () => void, getContext: () => Module) => void;
type IRequireContextGetter = () => RequireContext;

type ReloadData = {
    key: string,
    module: any,
    reloaded: boolean,
}

class WebpackPluginLoaderQueueProcessor extends QueueProcessor<ReloadData, void> {
    constructor(public loader: WebpackPluginLoader<any, any>) {
        super(1);
    }
    executor(data: ReloadData): Promise<void> {
        return this.loader.queuedCustomReloadLogic(data);
    }
}

/**
 * HMR Plugin Loader
 * Example:
 * new WebpackPluginLoader('openPlugins',
 *      () => require.context(__dirname + '/publicPlugins', false, /Plugin\/index\.js$/),
 *      (acceptor, getContext) => module.hot.accept(getContext().id, acceptor));
 */
export default abstract class WebpackPluginLoader<C, P extends IPlugin> {
    plugins: P[] = [];
    acceptor: IAcceptor;
    logger: Logger;
    requireContextGetter: IRequireContextGetter;
    pluginContext: C | null = null;
    reloadQueue: QueueProcessor<ReloadData, void>;
    constructor(name: string | Logger, requireContextGetter: IRequireContextGetter, acceptor: IAcceptor) {
        this.logger = Logger.from(name);
        this.requireContextGetter = requireContextGetter;
        this.acceptor = acceptor;
        this.reloadQueue = new WebpackPluginLoaderQueueProcessor(this);
    }
    abstract async onReload(module: P): Promise<void>;
    abstract async onLoad(module: P): Promise<void>;
    abstract async onUnload(module: P): Promise<void>;
    public async queuedCustomReloadLogic(data: ReloadData) {
        this.logger.ident(data.key);
        if (!data.reloaded) {
            this.logger.log(`${data.key} is loading`);
            let plugin = await data.module;
            if (plugin.default)
                plugin = plugin.default;
            plugin = new plugin();
            plugin.file = data.key;
            Object.assign(plugin, this.pluginContext);
            try {
                if (!plugin.init) {
                    this.logger.log('Plugin has no init() method, skipping call');
                } else {
                    this.logger.log('Calling init()');
                    await plugin.init();
                }
                await (this.onLoad(plugin));
                this.plugins.push(plugin);
            } catch (e) {
                this.logger.error(`Load failed`);
                this.logger.error(e.stack);
            }
        }
        else {
            this.logger.log(`${data.key} is reloading`);
            let plugin = await data.module;
            if (plugin.default)
                plugin = plugin.default;
            plugin = new plugin();
            plugin.file = data.key;
            Object.assign(plugin, this.pluginContext);
            let alreadyLoaded = this.plugins.filter(pl => pl.file === data.key);
            if (alreadyLoaded.length === 0) {
                this.logger.warn('This plugin wasn\'t loaded before, may be reload is for fix');
            } else {
                this.logger.log('Plugin was loaded before, unloading old instances');
                let instances = this.plugins.length;
                for (let alreadyLoadedPlugin of alreadyLoaded) {
                    try {
                        // Deinit plugin
                        if (!alreadyLoadedPlugin.deinit) {
                            this.logger.log('Plugin has no deinit() method, skipping call');
                        } else {
                            this.logger.log('Calling deinit()');
                            await alreadyLoadedPlugin.deinit();
                        }
                    } catch (e) {
                        this.logger.error(`Unload failed`);
                        this.logger.error(e.stack);
                    } finally {
                        this.onUnload(alreadyLoadedPlugin);
                        // Remove from list
                        this.plugins.splice(this.plugins.indexOf(alreadyLoadedPlugin), 1);
                    }
                }
                let newInstances = this.plugins.length;
                if (instances - newInstances !== 1) {
                    this.logger.warn('Eww... found non 1 plugin instance in memory. May be it is error? Instances found=' + (instances - newInstances));
                } else {
                    this.logger.log('Plugin unloaded');
                }
            }
            if (!plugin.init) {
                this.logger.log('Plugin has no deinit() method, skipping call');
            } else {
                this.logger.log('Calling init()');
                await plugin.init();
            }
            this.plugins.push(plugin);
            this.onReload(plugin);
        }
        this.logger.deent();
    }
    async load(pluginContext: C) {
        this.pluginContext = pluginContext;
        let context = this.requireContextGetter();
        let modules: { [key: string]: any } = {};
        context.keys().forEach((key) => {
            let module = context(key);
            modules[key] = module;
            this.reloadQueue.runTask({ key, module, reloaded: false });
        });

        if (module.hot) {
            this.acceptor(() => {
                let reloadedContext = this.requireContextGetter();
                reloadedContext.keys().map(key => [key, reloadedContext(key)]).filter(reloadedModule => modules[reloadedModule[0]] !== reloadedModule[1]).forEach((module) => {
                    modules[module[0]] = module[1];
                    this.reloadQueue.runTask({ key: module[0], module: module[1], reloaded: true });
                });
            }, this.requireContextGetter as any);
        }

        return this.plugins;
    }
}
