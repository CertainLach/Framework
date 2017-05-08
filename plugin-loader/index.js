import Logger from '@meteor-it/logger';
import {readDir} from '@meteor-it/fs';
import {asyncEach} from '@meteor-it/async';

const PLUGIN_REQUIRED_FIELDS = ['name', 'author', 'description', 'dependencies', 'init'];

function isAllDepsResolved(plugin) {
    // console.log(plugin.resolved);
    if (!plugin) return false;
    if (!plugin.resolved) return false;
    if (plugin.dependencies.length === 0) return true;
    if (plugin.dependencies.length === Object.keys(plugin.resolved).length) return true;
    return false;
}

function validatePlugin(plugin) {
    for (let field of PLUGIN_REQUIRED_FIELDS) {
        if (!plugin[field]) {
            if (field === 'name') {
                throw new Error('No ' + field + ' is defined for plugin in plugins/' + plugin.file + '!');
            }
            else {
                throw new Error('No ' + field + ' is defined for "' + plugin.name + '" in plugins/' + plugin.file + '!');
            }
        }
    }
}

export default class PluginLoader {
    logger;
    name;
    folder;

    constructor(name, folder) {
        this.name = name;
        this.logger = new Logger(name);
        this.folder = folder;
    }
    async load() {
        try {
            this.logger.log('Started plugin loader...');
            this.logger.log('Listening plugin dir');
            let files = await readDir(this.folder);
            this.logger.log('Found {blue}%d{/blue} candidats', files.length);
            this.logger.ident('Requiring them');
            const plugins = files.map(file => {
                this.logger.log('Loading {magenta}%s{/magenta}', file);
                let plugin = require(`${this.folder}/${file}`);
                plugin.file = file;
                return plugin;
            });
            this.logger.log('All plugins are loaded.');
            this.logger.deent();
            this.logger.ident('Validating and displaying copyrights');
            await asyncEach(plugins,plugin => {
                validatePlugin(plugin);
                this.logger.ident(plugin.name);
                this.logger.log('Name:         {blue}%s{/blue}', plugin.name);
                this.logger.log('Author:       {blue}%s{/blue}', plugin.author);
                this.logger.log('Description:  {blue}%s{/blue}', plugin.description);
                if (plugin.dependencies.length > 0)
                    this.logger.log('Requires:     {blue}%d{/blue} other plugins (%s)', plugin.dependencies.length, plugin.dependencies.map(dep => `{green}${dep}{/green}`).join(', '));
                this.logger.deent();
            });
            this.logger.deent();
            this.logger.ident('Dependecy load cycle');
            let notAllPlugins = true;
            let resolvedPlugins = {};
            let cycle = 0;
            while (notAllPlugins) {
                notAllPlugins = false;
                this.logger.ident('Cycle ' + cycle++);
                let pluginInitAtThisCycle = false;
                // if (!plugins)
                //     this.logger.error('');
                await asyncEach(plugins, async plugin => {
                    if (isAllDepsResolved(plugin))
                        return;
                    if (!plugin)
                        throw new Error('WTF?');
                    this.logger.ident('Deps for ' + plugin.name);
                    if (!plugin.resolved)
                        plugin.resolved = {};
                    plugin.dependencies.forEach(dep => {
                        if (!plugin.resolved[dep]) {
                            this.logger.log('Searching for %s', dep);
                            if (resolvedPlugins[dep]) {
                                this.logger.log('Resolved %s', dep);
                                plugin.resolved[dep] = resolvedPlugins[dep];
                                pluginInitAtThisCycle = true;
                            }
                            else {
                                this.logger.warn('%s not found in loaded plugins list! May be loaded on next cycle.', dep);
                                notAllPlugins = true;
                            }
                        }
                    });
                    if (isAllDepsResolved(plugin)) {
                        this.logger.log('Resolved all deps for %s', plugin.name);
                        this.logger.ident(plugin.name+'.init()');
                        await plugin.init(plugin.resolved);
                        this.logger.deent();
                        resolvedPlugins[plugin.name] = plugin;
                        pluginInitAtThisCycle = true;
                    }
                    this.logger.deent();
                });
                this.logger.deent();
                if (notAllPlugins && !pluginInitAtThisCycle)
                    throw new Error('Some dependencies are not resolved!');
            }
            this.logger.deent();
            this.logger.deent();
            this.logger.deent();
            this.logger.ident('Post init');
            await asyncEach(plugins,async plugin=>{
                if(plugin.postInit){
                    this.logger.ident(plugin.name+'.postInit()');
                    await plugin.postInit();
                    this.logger.deent();
                }
            });
            this.logger.deent();
            this.logger.log('Plugin loader finished thier work.');
            return plugins;
        }
        catch (e) {
            this.logger.deentAll();
            throw e;
        }
    }
}
