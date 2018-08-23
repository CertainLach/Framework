/// <reference types="node" />
import Logger from '@meteor-it/logger';
import EventEmitter from "events";
import IPlugin from "./IPlugin";
/**
 * Node.JS plugin loader
 * Loads plugins from directory, watching for fs
 * events with chokidar
 */
export default class SoftPluginLoader<D> {
    logger: Logger;
    folder: string;
    watcher: EventEmitter;
    autoData: D;
    plugins: IPlugin[];
    constructor(name: Logger | string, folder: string);
    load(data: D): Promise<IPlugin[]>;
    findPluginAtPath(pluginPath: string): [IPlugin, number];
    unloadPlugin(pluginPath: string): Promise<void>;
    loadPlugin(pluginPath: string): any;
    validatePlugin(plugin: IPlugin): void;
    callInit(plugin: IPlugin): Promise<void>;
    onChange(pluginPath: string): Promise<void>;
    watcherReady: boolean;
    onAdd(pluginPath: string): Promise<void>;
    onRemove(pluginPath: string): Promise<void>;
    watch(): Promise<void>;
}
