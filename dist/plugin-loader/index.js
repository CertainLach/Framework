"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const logger_1 = require("@meteor-it/logger");
const fs_1 = require("@meteor-it/fs");
const utils_1 = require("@meteor-it/utils");
const queue_1 = require("@meteor-it/queue");
const path_1 = require("path");
const chokidar = require("chokidar");
const PLUGIN_REQUIRED_FIELDS = ['name', 'author', 'description', 'dependencies'];
function isAllDepsResolved(plugin) {
    if (!plugin)
        return false;
    if (!plugin.resolved)
        return false;
    if (plugin.dependencies.length === 0)
        return true;
    if (plugin.dependencies.length === Object.keys(plugin.resolved).length)
        return true;
    return false;
}
function validatePlugin(plugin, isHard) {
    for (let field of PLUGIN_REQUIRED_FIELDS) {
        if (!plugin.constructor[field]) {
            if (field === 'name') {
                throw new Error('No name is defined for plugin in "' + plugin.file + '"!\nIf this plugin is defined in ES6 style, please write class name');
            }
            else {
                if (field === 'dependencies' && !isHard)
                    continue;
                console.log(plugin.constructor);
                throw new Error('No ' + field + ' is defined for "' + plugin.name + '" in "' + plugin.file + '"!');
            }
        }
    }
}
class HardPluginLoader {
    constructor(name, folder) {
        this.name = name;
        this.logger = new logger_1.default(name);
        this.folder = folder;
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.logger.log('Started hard plugin loader...');
                this.logger.log('Listening plugin dir');
                let files = yield fs_1.readDir(this.folder);
                this.logger.log('Found {blue}%d{/blue} candidats', files.length);
                this.logger.ident('Requiring them');
                const plugins = files.map(file => {
                    this.logger.log('Loading {magenta}%s{/magenta}', file);
                    let plugin = require(`${this.folder}/${file}`);
                    if (plugin.default) {
                        this.logger.log('Assuming that %s is a ES6 plugin (.default found)');
                        plugin = plugin.default;
                    }
                    plugin.file = file;
                    return plugin;
                });
                this.logger.log('All plugins are loaded.');
                this.logger.deent();
                this.logger.ident('Validating and displaying copyrights');
                yield utils_1.asyncEach(plugins, plugin => {
                    validatePlugin(plugin, true);
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
                    yield utils_1.asyncEach(plugins, (plugin) => __awaiter(this, void 0, void 0, function* () {
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
                            this.logger.ident(plugin.name + '.init()');
                            yield plugin.init(plugin.resolved);
                            this.logger.deent();
                            resolvedPlugins[plugin.name] = plugin;
                            pluginInitAtThisCycle = true;
                        }
                        this.logger.deent();
                    }));
                    this.logger.deent();
                    if (notAllPlugins && !pluginInitAtThisCycle)
                        throw new Error('Some dependencies are not resolved!');
                }
                this.logger.deent();
                this.logger.deent();
                this.logger.deent();
                this.logger.ident('Post init');
                yield utils_1.asyncEach(plugins, (plugin) => __awaiter(this, void 0, void 0, function* () {
                    if (plugin.postInit) {
                        this.logger.ident(plugin.name + '.postInit()');
                        yield plugin.postInit();
                        this.logger.deent();
                    }
                }));
                this.logger.deent();
                this.logger.log('Plugin loader finished thier work.');
                return plugins;
            }
            catch (e) {
                this.logger.deentAll();
                throw e;
            }
        });
    }
}
exports.HardPluginLoader = HardPluginLoader;
class SoftPluginLoader {
    constructor(name, folder) {
        this.watcherReady = false;
        this.name = name;
        this.logger = new logger_1.default(name);
        this.folder = folder;
    }
    load(data) {
        return __awaiter(this, void 0, void 0, function* () {
            this.autoData = data;
            try {
                this.logger.log('Started soft plugin loader...');
                this.logger.log('Listening plugin dir');
                let files = yield fs_1.readDir(this.folder);
                this.logger.log('Found {blue}%d{/blue} candidats', files.length);
                this.logger.ident('Requiring them');
                const plugins = files.map(file => {
                    try {
                        this.logger.log('Loading {magenta}%s{/magenta}', file);
                        return this.loadPlugin(path_1.resolve(this.folder, file));
                    }
                    catch (e) {
                        this.logger.error('Error loading %s! Plugin will load at change!', file);
                        this.logger.error(e.stack);
                        return null;
                    }
                }).filter(plugin => plugin !== null);
                this.logger.log('All plugins are loaded.');
                this.logger.deent();
                this.logger.ident('Validating and displaying copyrights');
                yield utils_1.asyncEach(plugins, plugin => {
                    try {
                        this.validatePlugin(plugin);
                    }
                    catch (e) {
                        this.logger.error('Error at plugin validation! Plugin will load at change!');
                        this.logger.error(e.stack);
                        plugins.splice(plugins.indexOf(plugin), 1);
                    }
                });
                this.logger.deent();
                this.logger.ident('Init');
                for (let plugin of plugins) {
                    try {
                        yield this.callInit(plugin);
                    }
                    catch (e) {
                        this.logger.error('Error at plugin init call! Plugin will load at change!');
                        this.logger.error(e.stack);
                        plugins.splice(plugins.indexOf(plugin), 1);
                    }
                }
                this.logger.deent();
                this.logger.log('Total added plugins: %d', plugins.length);
                this.logger.log('Plugin loader finished thier work, starting watcher');
                this.plugins = plugins;
                this.watch();
                return this.plugins;
            }
            catch (e) {
                this.logger.deentAll();
                throw e;
            }
        });
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
    unloadPlugin(pluginPath) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log('Unloading...');
            let [found, foundId] = this.findPluginAtPath(pluginPath);
            this.logger.log('Calling uninit()...');
            if (found.uninit) {
                this.logger.ident(found.constructor.name + '.uninit()');
                yield found.uninit();
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
        });
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
        plugin.file = pluginPath;
        return plugin;
    }
    validatePlugin(plugin) {
        this.logger.log('Revalidating...');
        if (!plugin.constructor.name)
            throw new Error('name is required for plugin!');
        if (!plugin.constructor.author)
            plugin.constructor.author = 'Anonymous';
        if (!plugin.constructor.description)
            plugin.constructor.description = 'Empty description';
        this.logger.ident(plugin.constructor.name);
        this.logger.log('Name:         {blue}%s{/blue}', plugin.constructor.name);
        this.logger.log('Author:       {blue}%s{/blue}', plugin.constructor.author);
        this.logger.log('Description:  {blue}%s{/blue}', plugin.constructor.description);
        this.logger.deent();
    }
    callInit(plugin) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log('Calling init()...');
            if (plugin.init) {
                this.logger.ident(plugin.constructor.name + '.init()');
                yield plugin.init();
                this.logger.deent();
            }
            else {
                this.logger.log('%s doesn\'t have init() method, skipping', plugin.constructor.name);
            }
        });
    }
    onChange(pluginPath) {
        return __awaiter(this, void 0, void 0, function* () {
            let [found, foundId] = this.findPluginAtPath(pluginPath);
            if (found) {
                this.logger.log('Plugin changed: %s (%d,%s)', found.constructor.name, foundId, found.file);
                yield this.unloadPlugin(pluginPath);
                let plugin = this.loadPlugin(pluginPath);
                this.validatePlugin(plugin);
                yield this.callInit(plugin);
                this.logger.log('Returning to the plugin list...');
                this.plugins.push(plugin);
            }
            else {
                this.logger.error('Unknown change! %s', pluginPath);
                setTimeout(() => this.onAdd(pluginPath), 1);
            }
        });
    }
    onAdd(pluginPath) {
        return __awaiter(this, void 0, void 0, function* () {
            let [found] = this.findPluginAtPath(pluginPath);
            if (found) {
                this.logger.error('Plugin already added! %s', pluginPath);
            }
            else {
                this.logger.log('Plugin added: %s', pluginPath);
                let plugin = this.loadPlugin(pluginPath);
                this.validatePlugin(plugin);
                yield this.callInit(plugin);
                this.logger.log('Returning to the plugin list...');
                this.plugins.push(plugin);
            }
        });
    }
    onRemove(pluginPath) {
        return __awaiter(this, void 0, void 0, function* () {
            let [found, foundId] = this.findPluginAtPath(pluginPath);
            if (found) {
                this.logger.log('Plugin removed: %s (%d,%s)', found.constructor.name, foundId, found.file);
                yield this.unloadPlugin(pluginPath);
            }
            else {
                this.logger.error('Unknown remove! %s', pluginPath);
            }
        });
    }
    watch() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.log('Watching plugins dir for changes...');
            this.watcher = chokidar.watch(this.folder, {
                ignored: /(^|[\/\\])\../,
                persistent: true,
                depth: 1
            });
            this.watcher
                .on('add', path => {
                if (!this.watcherReady)
                    return;
                this.logger.log(`File ${path} has been added, loading plugins...`);
                setTimeout(() => this.onAdd(path), 1);
            })
                .on('change', path => {
                this.logger.log(`File ${path} has been changed, reloading plugins...`);
                setTimeout(() => this.onChange(path), 1);
            })
                .on('unlink', path => {
                this.logger.log(`File ${path} has been removed, removing plugins...`);
                setTimeout(() => this.onRemove(path), 1);
            });
            this.watcher
                .on('error', error => this.logger.err(`Watcher error: ${error}`))
                .on('ready', () => {
                this.logger.log('Initial scan completed, ready to look at plugin changes');
                this.watcherReady = true;
            });
        });
    }
}
__decorate([
    queue_1.default(1),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SoftPluginLoader.prototype, "onChange", null);
__decorate([
    queue_1.default(1),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SoftPluginLoader.prototype, "onAdd", null);
__decorate([
    queue_1.default(1),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SoftPluginLoader.prototype, "onRemove", null);
exports.SoftPluginLoader = SoftPluginLoader;
class WebpackPluginLoader {
    constructor(name, requireContextGetter, acceptor) {
        this.plugins = [];
        this.logger = new logger_1.default(name);
        this.requireContextGetter = requireContextGetter;
        this.acceptor = acceptor;
    }
    customReloadLogic(key, module, reloaded) {
        return __awaiter(this, void 0, void 0, function* () {
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
                }
                else {
                    this.logger.log('Calling init()');
                    yield plugin.init();
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
                        if (!alreadyLoadedPlugin.deinit) {
                            this.logger.log('Plugin has no deinit() method, skipping call');
                        }
                        else {
                            this.logger.log('Calling deinit()');
                            yield alreadyLoadedPlugin.deinit();
                        }
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
                }
                else {
                    this.logger.log('Calling init()');
                    yield plugin.init();
                }
                this.plugins.push(plugin);
            }
            this.logger.deent();
        });
    }
    load(pluginContext) {
        return __awaiter(this, void 0, void 0, function* () {
            this.pluginContext = pluginContext;
            let context = this.requireContextGetter();
            var modules = {};
            context.keys().forEach((key) => {
                var module = context(key);
                modules[key] = module;
                this.customReloadLogic(key, module, false);
            });
            if (module.hot) {
                console.log('Adding HMR to', context.id);
                this.acceptor(() => {
                    let reloadedContext = this.requireContextGetter();
                    reloadedContext.keys().map(key => [key, reloadedContext(key)]).filter(reloadedModule => modules[reloadedModule[0]] !== reloadedModule[1]).forEach((module) => {
                        modules[module[0]] = module[1];
                        this.customReloadLogic(module[0], module[1], true);
                    });
                }, this.requireContextGetter);
            }
            return this.plugins;
        });
    }
}
__decorate([
    queue_1.default(1),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], WebpackPluginLoader.prototype, "customReloadLogic", null);
exports.WebpackPluginLoader = WebpackPluginLoader;
//# sourceMappingURL=index.js.map