///<reference types="webpack-env" />

import Logger from '@meteor-it/logger';
import IPlugin from './IPlugin';

type Module = __WebpackModuleApi.Module;
type RequireContext = __WebpackModuleApi.RequireContext;

type IAcceptor = (acceptor: () => void, getContext: () => Module) => void;
type IRequireContextGetter = () => RequireContext;

/**
 * HMR Plugin Loader
 * Example:
 * new WebpackPluginLoader('openPlugins',
 *      () => require.context(__dirname + '/publicPlugins', false, /Plugin\/index\.js$/),
 *      (acceptor, getContext) => module.hot.accept(getContext().id, acceptor));
 */
export default class WebpackPluginLoader<C> {
    plugins: IPlugin[] = [];
    acceptor: IAcceptor;
    logger: Logger;
    requireContextGetter: IRequireContextGetter;
    pluginContext: C;
    constructor(name: string | Logger, requireContextGetter: IRequireContextGetter, acceptor: IAcceptor) {
        this.logger = Logger.from(name);
        this.requireContextGetter = requireContextGetter;
        this.acceptor = acceptor;
    }
    // TODO: Queue
    // @queue(1)
    async customReloadLogic(key: string, module: any, reloaded: boolean) {
        this.logger.ident(key);
        if (!reloaded) {
            this.logger.log(`${key} is loading`);
            if (module.default)
                module = module.default;
            let plugin = module;
            if (plugin.default)
                plugin = plugin.default;
            plugin = new plugin();
            plugin.file = key;
            Object.assign(plugin, this.pluginContext);
            if (!plugin.init) {
                this.logger.log('Plugin has no init() method, skipping call');
            } else {
                this.logger.log('Calling init()');
                await plugin.init();
            }
            this.plugins.push(plugin);
        }
        else {
            this.logger.log(`${key} is reloading`);
            if (module.default)
                module = module.default;
            let plugin = module;
            if (plugin.default)
                plugin = plugin.default;
            plugin = new plugin();
            plugin.file = key;
            Object.assign(plugin, this.pluginContext);
            let alreadyLoaded = this.plugins.filter(pl => pl.file === key);
            if (alreadyLoaded.length === 0) {
                this.logger.warn('This plugin wasn\'t loaded before, may be reload is for fix');
            }
            else {
                this.logger.log('Plugin was loaded before, unloading old instances');
                let instances = this.plugins.length;
                for (let alreadyLoadedPlugin of alreadyLoaded) {
                    // Deinit plugin
                    if (!alreadyLoadedPlugin.deinit) {
                        this.logger.log('Plugin has no deinit() method, skipping call');
                    } else {
                        this.logger.log('Calling deinit()');
                        await alreadyLoadedPlugin.deinit();
                    }
                    // Remove from list
                    this.plugins.splice(this.plugins.indexOf(alreadyLoadedPlugin), 1);
                }
                let newInstances = this.plugins.length;
                if (instances - newInstances !== 1) {
                    this.logger.warn('Eww... found non 1 plugin instance in memory. May be it is error? Instances found=' + (instances - newInstances));
                }
                else {
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
            this.customReloadLogic(key, module, false);
        });

        if (module.hot) {
            this.acceptor(() => {
                let reloadedContext = this.requireContextGetter();
                reloadedContext.keys().map(key => [key, reloadedContext(key)]).filter(reloadedModule => modules[reloadedModule[0]] !== reloadedModule[1]).forEach((module) => {
                    modules[module[0]] = module[1];
                    this.customReloadLogic(module[0], module[1], true);
                });
            }, this.requireContextGetter as any);
        }

        return this.plugins;
    }
}
