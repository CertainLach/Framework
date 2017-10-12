import Logger from '@meteor-it/logger';
import queue from '@meteor-it/queue';

export default class WebpackPluginLoader {
    plugins = [];
    acceptor;
    logger: Logger;
    requireContextGetter;
    pluginContext:any;
    constructor(name, requireContextGetter, acceptor) {
        this.logger = new Logger(name);
        this.requireContextGetter = requireContextGetter;
        this.acceptor=acceptor;
    }
    @queue(1)
    async customReloadLogic(key, module, reloaded) {
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
            }else{
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
                for(let alreadyLoadedPlugin of alreadyLoaded){
                    // Deinit plugin
                    if(!alreadyLoadedPlugin.deinit){
                        this.logger.log('Plugin has no deinit() method, skipping call');
                    }else{
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
            }else{
                this.logger.log('Calling init()');
                await plugin.init();
            }
            this.plugins.push(plugin);
        }
        this.logger.deent();
    }
    async load(pluginContext) {
        this.pluginContext = pluginContext;
        let context = this.requireContextGetter();
        var modules = {};
        context.keys().forEach((key) => {
            var module = context(key);
            modules[key] = module;
            this.customReloadLogic(key, module, false);
        });

        if (module.hot) {
            console.log('Adding HMR to',context.id);
            this.acceptor(() => {
                let reloadedContext = this.requireContextGetter();
                reloadedContext.keys().map(key=>[key, reloadedContext(key)]).filter(reloadedModule=>modules[reloadedModule[0]] !== reloadedModule[1]).forEach((module) => {
                    modules[module[0]] = module[1];
                    this.customReloadLogic(module[0], module[1], true);
                });
            },this.requireContextGetter);
        }

        return this.plugins;
    }
}
