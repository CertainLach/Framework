import {validatePlugin,isAllDepsResolved} from './nonWebpackLoaderUtils'
import Logger from '@meteor-it/logger';
import {readDir} from '@meteor-it/fs';
import {asyncEach} from '@meteor-it/utils';
import queue from '@meteor-it/queue';
import {resolve} from 'path';
import * as chokidar from 'chokidar';

export default class SoftPluginLoader {
    logger;
    name;
    folder;
    watcher;
    autoData;
    plugins: any[];

    constructor(name, folder) {
        this.name = name;
        this.logger = new Logger(name);
        this.folder = folder;
    }
    async load(data) {
        this.autoData = data;
        try {
            this.logger.log('Started soft plugin loader...');
            this.logger.log('Listening plugin dir');
            let files = await readDir(this.folder);
            this.logger.log('Found {blue}%d{/blue} candidats', files.length);
            this.logger.ident('Requiring them');
            const plugins = files.map(file => {
                try{
                    this.logger.log('Loading {magenta}%s{/magenta}', file);
                    return this.loadPlugin(resolve(this.folder, file));
                }catch(e){
                    this.logger.error('Error loading %s! Plugin will load at change!',file);
                    this.logger.error(e.stack);
                    return null;
                }
            }).filter(plugin=>plugin!==null);
            this.logger.log('All plugins are loaded.');
            this.logger.deent();
            this.logger.ident('Validating and displaying copyrights');
            await asyncEach(plugins, plugin => {
                try{
                    this.validatePlugin(plugin);
                }catch(e){
                    this.logger.error('Error at plugin validation! Plugin will load at change!');
                    this.logger.error(e.stack);
                    plugins.splice(plugins.indexOf(plugin), 1);
                }
            });
            this.logger.deent();
            this.logger.ident('Init');
            for (let plugin of plugins) {
                try{
                    await this.callInit(plugin);
                }catch(e){
                    this.logger.error('Error at plugin init call! Plugin will load at change!');
                    this.logger.error(e.stack);
                    plugins.splice(plugins.indexOf(plugin), 1);
                }
            }
            this.logger.deent();
            this.logger.log('Total added plugins: %d',plugins.length);
            this.logger.log('Plugin loader finished thier work, starting watcher');
            this.plugins = plugins;
            this.watch();
            return this.plugins;
        }
        catch (e) {
            this.logger.deentAll();
            throw e;
        }
    }
    findPluginAtPath(pluginPath) {
        let found = null;
        let foundId = -1;
        this.plugins.forEach((plugin, id) => {
            if (plugin.file === pluginPath) {
                found = plugin;
                foundId = id;
            }
        });
        return [found, foundId];
    }
    async unloadPlugin(pluginPath) {
        this.logger.log('Unloading...');
        let [found, foundId] = this.findPluginAtPath(pluginPath);
        this.logger.log('Calling uninit()...');
        if(found.uninit){
            this.logger.ident(found.constructor.name + '.uninit()');
            await found.uninit();
            this.logger.deent();
        }
        else {
            this.logger.log('%s doesn\'t have uninit() method, skipping', found.constructor.name);
        }
        var name = require.resolve(pluginPath);
        this.logger.log('Full name = %s', name);
        this.logger.log('In cache: ' + !!require.cache[name]);
        if (!!require.cache[name]) {
            this.logger.log('Forgetting about them...');
            delete require.cache[name];
            delete this.plugins[foundId];
            this.plugins.splice(foundId, 1);
        }
    }
    loadPlugin(pluginPath) {
        this.logger.log('Loading...');
        let plugin = require(pluginPath);
        if (plugin.default)
            plugin = plugin.default;
        plugin = new plugin();
        Object.keys(this.autoData).forEach(key => {
            plugin[key] = this.autoData[key];
        });
        plugin.file=pluginPath;
        return plugin;
    }
    validatePlugin(plugin) {
        this.logger.log('Revalidating...');
        if(!plugin.constructor.name)
            throw new Error('name is required for plugin!');
        if(!plugin.constructor.author)
            plugin.constructor.author='Anonymous';
        if(!plugin.constructor.description)
            plugin.constructor.description='Empty description';
        this.logger.ident(plugin.constructor.name);
        this.logger.log('Name:         {blue}%s{/blue}', plugin.constructor.name);
        this.logger.log('Author:       {blue}%s{/blue}', plugin.constructor.author);
        this.logger.log('Description:  {blue}%s{/blue}', plugin.constructor.description);
        this.logger.deent();
    }
    async callInit(plugin) {
        this.logger.log('Calling init()...');
        if (plugin.init) {
            this.logger.ident(plugin.constructor.name + '.init()');
            await plugin.init();
            this.logger.deent();
        }
        else {
            this.logger.log('%s doesn\'t have init() method, skipping', plugin.constructor.name);
        }
    }
    @queue(1)
    async onChange(pluginPath) {
        let [found, foundId] = this.findPluginAtPath(pluginPath);
        if (found) {
            this.logger.log('Plugin changed: %s (%d,%s)', found.constructor.name, foundId, found.file);
            await this.unloadPlugin(pluginPath);
            let plugin = this.loadPlugin(pluginPath);
            this.validatePlugin(plugin);
            await this.callInit(plugin);

            this.logger.log('Returning to the plugin list...');
            this.plugins.push(plugin);
        }
        else {
            this.logger.error('Unknown change! %s', pluginPath);
            setTimeout(()=>this.onAdd(pluginPath),1);
        }
    }
    watcherReady = false;
    @queue(1)
    async onAdd(pluginPath) {
        let [found] = this.findPluginAtPath(pluginPath);
        if (found) {
            this.logger.error('Plugin already added! %s', pluginPath);
        }
        else {
            this.logger.log('Plugin added: %s', pluginPath);
            let plugin = this.loadPlugin(pluginPath);
            this.validatePlugin(plugin);
            await this.callInit(plugin);

            this.logger.log('Returning to the plugin list...');
            this.plugins.push(plugin);
        }
    }
    @queue(1)
    async onRemove(pluginPath) {
        let [found, foundId] = this.findPluginAtPath(pluginPath);
        if (found) {
            this.logger.log('Plugin removed: %s (%d,%s)', found.constructor.name, foundId, found.file);
            await this.unloadPlugin(pluginPath);
        }
        else {
            this.logger.error('Unknown remove! %s', pluginPath);
        }
    }
    async watch() {
        this.logger.log('Watching plugins dir for changes...');
        this.watcher = chokidar.watch(this.folder, {
            ignored: /(^|[\/\\])\../,
            persistent: true,
            depth: 1
        });
        this.watcher
            .on('add', path => {
                if (!this.watcherReady) // To prevent adding files from initial scan
                    return;
                this.logger.log(`File ${path} has been added, loading plugins...`);
                setTimeout(()=>this.onAdd(path),1);
            })
            .on('change', path => {
                this.logger.log(`File ${path} has been changed, reloading plugins...`);
                setTimeout(()=>this.onChange(path),1);
            })
            .on('unlink', path => {
                this.logger.log(`File ${path} has been removed, removing plugins...`);
                setTimeout(()=>this.onRemove(path),1);
            });

        // More possible events.
        this.watcher
            .on('error', error => this.logger.err(`Watcher error: ${error}`))
            .on('ready', () => {
                this.logger.log('Initial scan completed, ready to look at plugin changes');
                this.watcherReady = true;
            });

    }
}