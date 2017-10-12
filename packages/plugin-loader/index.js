///<reference types="webpack-env" />
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
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import Logger from '@meteor-it/logger';
import { readDir } from '@meteor-it/fs';
import { asyncEach } from '@meteor-it/utils';
import queue from '@meteor-it/queue';
import { resolve } from 'path';
import * as chokidar from 'chokidar';
var PLUGIN_REQUIRED_FIELDS = ['name', 'author', 'description', 'dependencies'];
function isAllDepsResolved(plugin) {
    // console.log(plugin.resolved);
    if (!plugin)
        return false;
    if (!plugin.resolved)
        return false;
    if (plugin.dependencies.length === 0)
        return true;
    return plugin.dependencies.length === Object.keys(plugin.resolved).length;
}
function validatePlugin(plugin, isHard) {
    for (var _i = 0, PLUGIN_REQUIRED_FIELDS_1 = PLUGIN_REQUIRED_FIELDS; _i < PLUGIN_REQUIRED_FIELDS_1.length; _i++) {
        var field = PLUGIN_REQUIRED_FIELDS_1[_i];
        if (!plugin.constructor[field]) {
            if (field === 'name') {
                throw new Error('No name is defined for plugin in "' + plugin.file + '"!\nIf this plugin is defined in ES6 style, please write class name');
            }
            else {
                if (field === 'dependencies' && !isHard)
                    continue; // Since soft plugins doesn't supports it
                console.log(plugin.constructor);
                throw new Error('No ' + field + ' is defined for "' + plugin.name + '" in "' + plugin.file + '"!');
            }
        }
    }
}
var HardPluginLoader = /** @class */ (function () {
    function HardPluginLoader(name, folder) {
        this.name = name;
        this.logger = new Logger(name);
        this.folder = folder;
    }
    HardPluginLoader.prototype.load = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var files, plugins, notAllPlugins_1, resolvedPlugins_1, cycle, _loop_1, this_1, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        this.logger.log('Started hard plugin loader...');
                        this.logger.log('Listening plugin dir');
                        return [4 /*yield*/, readDir(this.folder)];
                    case 1:
                        files = _a.sent();
                        this.logger.log('Found {blue}%d{/blue} candidats', files.length);
                        this.logger.ident('Requiring them');
                        plugins = files.map(function (file) {
                            _this.logger.log('Loading {magenta}%s{/magenta}', file);
                            var plugin = require(_this.folder + "/" + file);
                            if (plugin.default) {
                                _this.logger.log('Assuming that %s is a ES6 plugin (.default found)');
                                plugin = plugin.default;
                            }
                            plugin.file = file;
                            return plugin;
                        });
                        this.logger.log('All plugins are loaded.');
                        this.logger.deent();
                        this.logger.ident('Validating and displaying copyrights');
                        return [4 /*yield*/, asyncEach(plugins, function (plugin) {
                                validatePlugin(plugin, true);
                                _this.logger.ident(plugin.name);
                                _this.logger.log('Name:         {blue}%s{/blue}', plugin.name);
                                _this.logger.log('Author:       {blue}%s{/blue}', plugin.author);
                                _this.logger.log('Description:  {blue}%s{/blue}', plugin.description);
                                if (plugin.dependencies.length > 0)
                                    _this.logger.log('Requires:     {blue}%d{/blue} other plugins (%s)', plugin.dependencies.length, plugin.dependencies.map(function (dep) { return "{green}" + dep + "{/green}"; }).join(', '));
                                _this.logger.deent();
                            })];
                    case 2:
                        _a.sent();
                        this.logger.deent();
                        this.logger.ident('Dependecy load cycle');
                        notAllPlugins_1 = true;
                        resolvedPlugins_1 = {};
                        cycle = 0;
                        _loop_1 = function () {
                            var pluginInitAtThisCycle;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        notAllPlugins_1 = false;
                                        this_1.logger.ident('Cycle ' + cycle++);
                                        pluginInitAtThisCycle = false;
                                        // if (!plugins)
                                        //     this.logger.error('');
                                        return [4 /*yield*/, asyncEach(plugins, function (plugin) { return __awaiter(_this, void 0, void 0, function () {
                                                var _this = this;
                                                return __generator(this, function (_a) {
                                                    switch (_a.label) {
                                                        case 0:
                                                            if (isAllDepsResolved(plugin))
                                                                return [2 /*return*/];
                                                            if (!plugin)
                                                                throw new Error('WTF?');
                                                            this.logger.ident('Deps for ' + plugin.name);
                                                            if (!plugin.resolved)
                                                                plugin.resolved = {};
                                                            plugin.dependencies.forEach(function (dep) {
                                                                if (!plugin.resolved[dep]) {
                                                                    _this.logger.log('Searching for %s', dep);
                                                                    if (resolvedPlugins_1[dep]) {
                                                                        _this.logger.log('Resolved %s', dep);
                                                                        plugin.resolved[dep] = resolvedPlugins_1[dep];
                                                                        pluginInitAtThisCycle = true;
                                                                    }
                                                                    else {
                                                                        _this.logger.warn('%s not found in loaded plugins list! May be loaded on next cycle.', dep);
                                                                        notAllPlugins_1 = true;
                                                                    }
                                                                }
                                                            });
                                                            if (!isAllDepsResolved(plugin)) return [3 /*break*/, 2];
                                                            this.logger.log('Resolved all deps for %s', plugin.name);
                                                            this.logger.ident(plugin.name + '.init()');
                                                            return [4 /*yield*/, plugin.init(plugin.resolved)];
                                                        case 1:
                                                            _a.sent();
                                                            this.logger.deent();
                                                            resolvedPlugins_1[plugin.name] = plugin;
                                                            pluginInitAtThisCycle = true;
                                                            _a.label = 2;
                                                        case 2:
                                                            this.logger.deent();
                                                            return [2 /*return*/];
                                                    }
                                                });
                                            }); })];
                                    case 1:
                                        // if (!plugins)
                                        //     this.logger.error('');
                                        _a.sent();
                                        this_1.logger.deent();
                                        if (notAllPlugins_1 && !pluginInitAtThisCycle)
                                            throw new Error('Some dependencies are not resolved!');
                                        return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _a.label = 3;
                    case 3:
                        if (!notAllPlugins_1) return [3 /*break*/, 5];
                        return [5 /*yield**/, _loop_1()];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 5:
                        this.logger.deent();
                        this.logger.deent();
                        this.logger.deent();
                        this.logger.ident('Post init');
                        return [4 /*yield*/, asyncEach(plugins, function (plugin) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            if (!plugin.postInit) return [3 /*break*/, 2];
                                            this.logger.ident(plugin.name + '.postInit()');
                                            return [4 /*yield*/, plugin.postInit()];
                                        case 1:
                                            _a.sent();
                                            this.logger.deent();
                                            _a.label = 2;
                                        case 2: return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 6:
                        _a.sent();
                        this.logger.deent();
                        this.logger.log('Plugin loader finished thier work.');
                        return [2 /*return*/, plugins];
                    case 7:
                        e_1 = _a.sent();
                        this.logger.deentAll();
                        throw e_1;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    return HardPluginLoader;
}());
export { HardPluginLoader };
var SoftPluginLoader = /** @class */ (function () {
    function SoftPluginLoader(name, folder) {
        this.watcherReady = false;
        this.name = name;
        this.logger = new Logger(name);
        this.folder = folder;
    }
    SoftPluginLoader.prototype.load = function (data) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var files, plugins_1, _i, plugins_2, plugin, e_2, e_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.autoData = data;
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 10, , 11]);
                        this.logger.log('Started soft plugin loader...');
                        this.logger.log('Listening plugin dir');
                        return [4 /*yield*/, readDir(this.folder)];
                    case 2:
                        files = _a.sent();
                        this.logger.log('Found {blue}%d{/blue} candidats', files.length);
                        this.logger.ident('Requiring them');
                        plugins_1 = files.map(function (file) {
                            try {
                                _this.logger.log('Loading {magenta}%s{/magenta}', file);
                                return _this.loadPlugin(resolve(_this.folder, file));
                            }
                            catch (e) {
                                _this.logger.error('Error loading %s! Plugin will load at change!', file);
                                _this.logger.error(e.stack);
                                return null;
                            }
                        }).filter(function (plugin) { return plugin !== null; });
                        this.logger.log('All plugins are loaded.');
                        this.logger.deent();
                        this.logger.ident('Validating and displaying copyrights');
                        return [4 /*yield*/, asyncEach(plugins_1, function (plugin) {
                                try {
                                    _this.validatePlugin(plugin);
                                }
                                catch (e) {
                                    _this.logger.error('Error at plugin validation! Plugin will load at change!');
                                    _this.logger.error(e.stack);
                                    plugins_1.splice(plugins_1.indexOf(plugin), 1);
                                }
                            })];
                    case 3:
                        _a.sent();
                        this.logger.deent();
                        this.logger.ident('Init');
                        _i = 0, plugins_2 = plugins_1;
                        _a.label = 4;
                    case 4:
                        if (!(_i < plugins_2.length)) return [3 /*break*/, 9];
                        plugin = plugins_2[_i];
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, this.callInit(plugin)];
                    case 6:
                        _a.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        e_2 = _a.sent();
                        this.logger.error('Error at plugin init call! Plugin will load at change!');
                        this.logger.error(e_2.stack);
                        plugins_1.splice(plugins_1.indexOf(plugin), 1);
                        return [3 /*break*/, 8];
                    case 8:
                        _i++;
                        return [3 /*break*/, 4];
                    case 9:
                        this.logger.deent();
                        this.logger.log('Total added plugins: %d', plugins_1.length);
                        this.logger.log('Plugin loader finished thier work, starting watcher');
                        this.plugins = plugins_1;
                        this.watch();
                        return [2 /*return*/, this.plugins];
                    case 10:
                        e_3 = _a.sent();
                        this.logger.deentAll();
                        throw e_3;
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    SoftPluginLoader.prototype.findPluginAtPath = function (pluginPath) {
        var found = null;
        var foundId = -1;
        this.plugins.forEach(function (plugin, id) {
            if (plugin.file === pluginPath) {
                found = plugin;
                foundId = id;
            }
        });
        return [found, foundId];
    };
    SoftPluginLoader.prototype.unloadPlugin = function (pluginPath) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, found, foundId, name;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.logger.log('Unloading...');
                        _a = this.findPluginAtPath(pluginPath), found = _a[0], foundId = _a[1];
                        this.logger.log('Calling uninit()...');
                        if (!found.uninit) return [3 /*break*/, 2];
                        this.logger.ident(found.constructor.name + '.uninit()');
                        return [4 /*yield*/, found.uninit()];
                    case 1:
                        _b.sent();
                        this.logger.deent();
                        return [3 /*break*/, 3];
                    case 2:
                        this.logger.log('%s doesn\'t have uninit() method, skipping', found.constructor.name);
                        _b.label = 3;
                    case 3:
                        name = require.resolve(pluginPath);
                        this.logger.log('Full name = %s', name);
                        this.logger.log('In cache: ' + !!require.cache[name]);
                        if (!!require.cache[name]) {
                            this.logger.log('Forgetting about them...');
                            delete require.cache[name];
                            delete this.plugins[foundId];
                            this.plugins.splice(foundId, 1);
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    SoftPluginLoader.prototype.loadPlugin = function (pluginPath) {
        var _this = this;
        this.logger.log('Loading...');
        var plugin = require(pluginPath);
        if (plugin.default)
            plugin = plugin.default;
        plugin = new plugin();
        Object.keys(this.autoData).forEach(function (key) {
            plugin[key] = _this.autoData[key];
        });
        plugin.file = pluginPath;
        return plugin;
    };
    SoftPluginLoader.prototype.validatePlugin = function (plugin) {
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
    };
    SoftPluginLoader.prototype.callInit = function (plugin) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.log('Calling init()...');
                        if (!plugin.init) return [3 /*break*/, 2];
                        this.logger.ident(plugin.constructor.name + '.init()');
                        return [4 /*yield*/, plugin.init()];
                    case 1:
                        _a.sent();
                        this.logger.deent();
                        return [3 /*break*/, 3];
                    case 2:
                        this.logger.log('%s doesn\'t have init() method, skipping', plugin.constructor.name);
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    SoftPluginLoader.prototype.onChange = function (pluginPath) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var _a, found, foundId, plugin;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.findPluginAtPath(pluginPath), found = _a[0], foundId = _a[1];
                        if (!found) return [3 /*break*/, 3];
                        this.logger.log('Plugin changed: %s (%d,%s)', found.constructor.name, foundId, found.file);
                        return [4 /*yield*/, this.unloadPlugin(pluginPath)];
                    case 1:
                        _b.sent();
                        plugin = this.loadPlugin(pluginPath);
                        this.validatePlugin(plugin);
                        return [4 /*yield*/, this.callInit(plugin)];
                    case 2:
                        _b.sent();
                        this.logger.log('Returning to the plugin list...');
                        this.plugins.push(plugin);
                        return [3 /*break*/, 4];
                    case 3:
                        this.logger.error('Unknown change! %s', pluginPath);
                        setTimeout(function () { return _this.onAdd(pluginPath); }, 1);
                        _b.label = 4;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    SoftPluginLoader.prototype.onAdd = function (pluginPath) {
        return __awaiter(this, void 0, void 0, function () {
            var found, plugin;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        found = this.findPluginAtPath(pluginPath)[0];
                        if (!found) return [3 /*break*/, 1];
                        this.logger.error('Plugin already added! %s', pluginPath);
                        return [3 /*break*/, 3];
                    case 1:
                        this.logger.log('Plugin added: %s', pluginPath);
                        plugin = this.loadPlugin(pluginPath);
                        this.validatePlugin(plugin);
                        return [4 /*yield*/, this.callInit(plugin)];
                    case 2:
                        _a.sent();
                        this.logger.log('Returning to the plugin list...');
                        this.plugins.push(plugin);
                        _a.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    SoftPluginLoader.prototype.onRemove = function (pluginPath) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, found, foundId;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.findPluginAtPath(pluginPath), found = _a[0], foundId = _a[1];
                        if (!found) return [3 /*break*/, 2];
                        this.logger.log('Plugin removed: %s (%d,%s)', found.constructor.name, foundId, found.file);
                        return [4 /*yield*/, this.unloadPlugin(pluginPath)];
                    case 1:
                        _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        this.logger.error('Unknown remove! %s', pluginPath);
                        _b.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    SoftPluginLoader.prototype.watch = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                this.logger.log('Watching plugins dir for changes...');
                this.watcher = chokidar.watch(this.folder, {
                    ignored: /(^|[\/\\])\../,
                    persistent: true,
                    depth: 1
                });
                this.watcher
                    .on('add', function (path) {
                    if (!_this.watcherReady)
                        return;
                    _this.logger.log("File " + path + " has been added, loading plugins...");
                    setTimeout(function () { return _this.onAdd(path); }, 1);
                })
                    .on('change', function (path) {
                    _this.logger.log("File " + path + " has been changed, reloading plugins...");
                    setTimeout(function () { return _this.onChange(path); }, 1);
                })
                    .on('unlink', function (path) {
                    _this.logger.log("File " + path + " has been removed, removing plugins...");
                    setTimeout(function () { return _this.onRemove(path); }, 1);
                });
                // More possible events.
                this.watcher
                    .on('error', function (error) { return _this.logger.err("Watcher error: " + error); })
                    .on('ready', function () {
                    _this.logger.log('Initial scan completed, ready to look at plugin changes');
                    _this.watcherReady = true;
                });
                return [2 /*return*/];
            });
        });
    };
    __decorate([
        queue(1),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], SoftPluginLoader.prototype, "onChange", null);
    __decorate([
        queue(1),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], SoftPluginLoader.prototype, "onAdd", null);
    __decorate([
        queue(1),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object]),
        __metadata("design:returntype", Promise)
    ], SoftPluginLoader.prototype, "onRemove", null);
    return SoftPluginLoader;
}());
export { SoftPluginLoader };
var WebpackPluginLoader = /** @class */ (function () {
    function WebpackPluginLoader(name, requireContextGetter, acceptor) {
        this.plugins = [];
        this.logger = new Logger(name);
        this.requireContextGetter = requireContextGetter;
        this.acceptor = acceptor;
    }
    WebpackPluginLoader.prototype.customReloadLogic = function (key, module, reloaded) {
        return __awaiter(this, void 0, void 0, function () {
            var plugin, plugin, alreadyLoaded, instances, _i, alreadyLoaded_1, alreadyLoadedPlugin, newInstances;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.ident(key);
                        if (!!reloaded) return [3 /*break*/, 4];
                        this.logger.log(key + " is loading");
                        if (module.default)
                            module = module.default;
                        plugin = module;
                        if (plugin.default)
                            plugin = plugin.default;
                        plugin = new plugin();
                        plugin.file = key;
                        Object.assign(plugin, this.pluginContext);
                        if (!!plugin.init) return [3 /*break*/, 1];
                        this.logger.log('Plugin has no init() method, skipping call');
                        return [3 /*break*/, 3];
                    case 1:
                        this.logger.log('Calling init()');
                        return [4 /*yield*/, plugin.init()];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        this.plugins.push(plugin);
                        return [3 /*break*/, 16];
                    case 4:
                        this.logger.log(key + " is reloading");
                        if (module.default)
                            module = module.default;
                        plugin = module;
                        if (plugin.default)
                            plugin = plugin.default;
                        plugin = new plugin();
                        plugin.file = key;
                        Object.assign(plugin, this.pluginContext);
                        alreadyLoaded = this.plugins.filter(function (pl) { return pl.file === key; });
                        if (!(alreadyLoaded.length === 0)) return [3 /*break*/, 5];
                        this.logger.warn('This plugin wasn\'t loaded before, may be reload is for fix');
                        return [3 /*break*/, 12];
                    case 5:
                        this.logger.log('Plugin was loaded before, unloading old instances');
                        instances = this.plugins.length;
                        _i = 0, alreadyLoaded_1 = alreadyLoaded;
                        _a.label = 6;
                    case 6:
                        if (!(_i < alreadyLoaded_1.length)) return [3 /*break*/, 11];
                        alreadyLoadedPlugin = alreadyLoaded_1[_i];
                        if (!!alreadyLoadedPlugin.deinit) return [3 /*break*/, 7];
                        this.logger.log('Plugin has no deinit() method, skipping call');
                        return [3 /*break*/, 9];
                    case 7:
                        this.logger.log('Calling deinit()');
                        return [4 /*yield*/, alreadyLoadedPlugin.deinit()];
                    case 8:
                        _a.sent();
                        _a.label = 9;
                    case 9:
                        // Remove from list
                        this.plugins.splice(this.plugins.indexOf(alreadyLoadedPlugin), 1);
                        _a.label = 10;
                    case 10:
                        _i++;
                        return [3 /*break*/, 6];
                    case 11:
                        newInstances = this.plugins.length;
                        if (instances - newInstances !== 1) {
                            this.logger.warn('Eww... found non 1 plugin instance in memory. May be it is error? Instances found=' + (instances - newInstances));
                        }
                        else {
                            this.logger.log('Plugin unloaded');
                        }
                        _a.label = 12;
                    case 12:
                        if (!!plugin.init) return [3 /*break*/, 13];
                        this.logger.log('Plugin has no deinit() method, skipping call');
                        return [3 /*break*/, 15];
                    case 13:
                        this.logger.log('Calling init()');
                        return [4 /*yield*/, plugin.init()];
                    case 14:
                        _a.sent();
                        _a.label = 15;
                    case 15:
                        this.plugins.push(plugin);
                        _a.label = 16;
                    case 16:
                        this.logger.deent();
                        return [2 /*return*/];
                }
            });
        });
    };
    WebpackPluginLoader.prototype.load = function (pluginContext) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var context, modules;
            return __generator(this, function (_a) {
                this.pluginContext = pluginContext;
                context = this.requireContextGetter();
                modules = {};
                context.keys().forEach(function (key) {
                    var module = context(key);
                    modules[key] = module;
                    _this.customReloadLogic(key, module, false);
                });
                if (module.hot) {
                    console.log('Adding HMR to', context.id);
                    this.acceptor(function () {
                        var reloadedContext = _this.requireContextGetter();
                        reloadedContext.keys().map(function (key) { return [key, reloadedContext(key)]; }).filter(function (reloadedModule) { return modules[reloadedModule[0]] !== reloadedModule[1]; }).forEach(function (module) {
                            modules[module[0]] = module[1];
                            _this.customReloadLogic(module[0], module[1], true);
                        });
                    }, this.requireContextGetter);
                }
                return [2 /*return*/, this.plugins];
            });
        });
    };
    __decorate([
        queue(1),
        __metadata("design:type", Function),
        __metadata("design:paramtypes", [Object, Object, Object]),
        __metadata("design:returntype", Promise)
    ], WebpackPluginLoader.prototype, "customReloadLogic", null);
    return WebpackPluginLoader;
}());
export { WebpackPluginLoader };
//# sourceMappingURL=index.js.map