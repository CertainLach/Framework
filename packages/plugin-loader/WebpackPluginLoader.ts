///<reference types="webpack-env" />

import Logger from '@meteor-it/logger';
import IPlugin from './IPlugin';
import { QueueProcessor } from '@meteor-it/queue';
import { assert } from 'console';

type RequireContext = __WebpackModuleApi.RequireContext;

type IRequireContextGetter = () => RequireContext;
type ModuleHot = {
    accept: any
}

type ReloadData = {
    key: string,
    module: any,
    reloaded: boolean,
}

class WebpackPluginLoaderQueueProcessor extends QueueProcessor<ReloadData, void> {
    constructor(public loader: WebpackPluginLoader<any, any>) {
        super(1);
    }
    async executor(data: ReloadData): Promise<void> {
        return await this.loader.queuedCustomReloadLogic(data);
    }
}

/**
 * HMR Plugin Loader
 * Example:
 * new WebpackPluginLoader('openPlugins',
 *    () => require.context(__dirname + '/publicPlugins', false, /Plugin\/index\.js$/),
 *    (acceptor, getContext) => {
 *        if (module.hot) {
 *            module.hot.accept(getContext().id, acceptor);
 *        }
 *    }
 * );
 *
 * These arguments have required code and can't be extracted to library,
 * because code needs to be preprocessed by webpack (in case of require.context) or
 * captures needed webpack processed contexts (module)
 */
export default abstract class WebpackPluginLoader<C, P extends IPlugin> {
    plugins: P[] = [];
    logger: Logger;
    reloadQueue: QueueProcessor<ReloadData, void>;
    constructor(
        name: string | Logger,
        private pluginContext: C | null = null,
        private requireContextGetter: IRequireContextGetter,
        private moduleHot: ModuleHot,
    ) {
        this.logger = Logger.from(name);
        this.reloadQueue = new WebpackPluginLoaderQueueProcessor(this);
    }

    abstract async onPreInit(module: P): Promise<void>;
    abstract async onPostInit(module: P): Promise<void>;

    abstract async onPreDeinit(module: P): Promise<void>;
    abstract async onPostDeinit(module: P): Promise<void>;

    abstract async onUnload(module: P): Promise<void>;

    private async callInit(plugin: P) {
        await (this.onPreInit(plugin));
        if (!plugin.init) {
            this.logger.log('Plugin has no init() method, skipping call');
        } else {
            this.logger.log('Calling init()');
            await plugin.init();
        }
        await (this.onPostInit(plugin));
    }

    private async callDeinit(plugin: P) {
        await (this.onPreDeinit(plugin));
        if (!plugin.deinit) {
            this.logger.log('Plugin has no deinit() method, skipping call');
        } else {
            this.logger.log('Calling deinit()');
            await plugin.deinit();
        }
        await (this.onPostDeinit(plugin));
    }

    private async constructPluginInstance(data: ReloadData): Promise<P> {
        let constructor = await data.module;
        if (constructor.default)
            constructor = constructor.default;
        const plugin: P = new constructor();
        plugin.file = data.key;
        plugin.loaderData = data;
        Object.assign(plugin, this.pluginContext);
        return plugin;
    }

    public async queuedCustomReloadLogic(data: ReloadData) {
        this.logger.ident(`${data.reloaded ? 'Reloading' : 'Loading'} ${data.key}`);
        if (!data.reloaded) {
            try {
                const plugin = await this.constructPluginInstance(data);
                try {
                    await this.callInit(plugin);
                    this.plugins.push(plugin);
                } catch (e) {
                    this.logger.error(`Load failed on init()`);
                    this.logger.error(e.stack);
                    await this.callDeinit(plugin);
                }
            } catch (e) {
                this.logger.error(`Load failed on early init`);
                this.logger.error(e.stack);
            }
        } else {
            try {
                const plugin = await this.constructPluginInstance(data);
                let alreadyLoaded = this.plugins.filter(pl => pl.file === data.key);
                let oldLoaderData: ReloadData | undefined;
                if (alreadyLoaded.length === 0) {
                    this.logger.warn('This plugin wasn\'t loaded before');
                } else {
                    this.logger.log('Plugin was loaded before, unloading old instances');
                    let instances = this.plugins.length;
                    for (let alreadyLoadedPlugin of alreadyLoaded) {
                        try {
                            await this.callDeinit(alreadyLoadedPlugin);
                        } catch (e) {
                            this.logger.error(`Unload failed on deinit()`);
                            this.logger.error(e.stack);
                        }
                        // Remove from list
                        this.plugins.splice(this.plugins.indexOf(alreadyLoadedPlugin), 1);
                    }
                    let newInstances = this.plugins.length;
                    assert(instances - newInstances === 1, 'More than 1 instance was found loaded in memory');
                    oldLoaderData = alreadyLoaded[0].loaderData;
                    this.logger.log('Plugin unloaded');
                }
                try {
                    await this.callInit(plugin);
                    this.plugins.push(plugin);
                } catch (e) {
                    this.logger.error(`Reload failed on init(), trying to load old plugin again`);
                    this.logger.error(e.stack);
                    if (oldLoaderData) {
                        await this.queuedCustomReloadLogic({ key: oldLoaderData.key, module: oldLoaderData.module, reloaded: false });
                    }
                }
            } catch (e) {
                this.logger.error(`Reload failed on early init`);
                this.logger.error(e.stack);
            }
        }
        this.logger.deent();
    }

    async load() {
        let context = this.requireContextGetter();
        let modules: { [key: string]: any } = {};
        context.keys().forEach((key) => {
            let module = context(key);
            modules[key] = module;
            this.reloadQueue.runTask({ key, module, reloaded: false });
        });

        if (this.moduleHot) {
            this.moduleHot.accept(this.requireContextGetter().id, () => {
                let reloadedContext = this.requireContextGetter();
                reloadedContext.keys().map(key => [key, reloadedContext(key)]).filter(reloadedModule => modules[reloadedModule[0]] !== reloadedModule[1]).forEach((module) => {
                    modules[module[0]] = module[1];
                    this.reloadQueue.runTask({ key: module[0], module: module[1], reloaded: true });
                });
            });
        }

        return this.plugins;
    }
}
