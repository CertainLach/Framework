import { Readable } from 'stream';

// noinspection JSUnusedGlobalSymbols
export function createReadStream(object: Buffer, options = {}): MultiStream {
    return new MultiStream(object, options);
}

// noinspection JSUnusedGlobalSymbols
export function readStreamToBuffer(stream: Readable, maxSize: number = 0): Promise<Buffer> {
    return new Promise((res, rej) => {
        const bufs: any = [];
        let size = 0;
        stream.on('data', d => {
            if (size + d.length > maxSize) {
                rej(new Error('Max buffer size exceeded'));
                return;
            }
            bufs.push(d);
            size += d.length;
        });
        stream.on('end', () => {
            res(Buffer.concat(bufs));
        });
        stream.on('error', rej);
    });
}

export interface IMultiStreamOptions {
    highWaterMark?: number;
    encoding?: BufferEncoding;
}

export class MultiStream extends Readable {
    private object: Buffer | null;
    constructor(object: Buffer, options: IMultiStreamOptions = {}) {
        super({
            highWaterMark: options.highWaterMark,
            encoding: options.encoding
        });
        this.object = object;
    }

    // noinspection JSUnusedGlobalSymbols
    _read() {
        this.push(this.object);
        this.object = null;
    }
}


// hello, world => Hello, world!
export function firstUppercase(str: string): string {
    return str.substr(0, 1).toUpperCase() + str.substr(1);
}

/**
 * @param x
 * @param y
 */
export function objectEquals(x: any, y: any): boolean {
    if (x === null || x === undefined || y === null || y === undefined) {
        return x === y;
    }
    if (x.constructor !== y.constructor) {
        return false;
    }
    if (x instanceof Function) {
        return x === y;
    }
    if (x instanceof RegExp) {
        return x.source === y.source && x.source === y.source;
    }
    if (x === y || x.valueOf() === y.valueOf()) {
        return true;
    }
    if (x instanceof Map) {
        if (x.size !== y.size)
            return false;
        if (!objectEquals([...x.keys()].sort(), [...y.keys()].sort()))
            return false;
        if (!objectEquals([...x.values()].sort(), [...y.values()].sort()))
            return false;
        return true;
    }
    if (x instanceof Set) {
        if (x.size !== y.size)
            return false;
        if (!objectEquals([...x.values()].sort(), [...y.values()].sort()))
            return false;
        return true;
    }
    if (Array.isArray(x) && x.length !== y.length) {
        return false;
    }

    let p = Object.keys(x);
    return Object.keys(y).every(i => p.indexOf(i) !== -1) && p.every(i => objectEquals(x[i], y[i]));
}

export function sleep(time: number): Promise<void> {
    return new Promise((res) => {
        setTimeout(res, time);
    });
}

// noinspection JSUnusedGlobalSymbols
/**
 * Like iterable.map(cb),
 * but cb can be async
 * @param iterable Array to process
 * @param cb Function to do with each element
 */
export function asyncEach<T, R>(iterable: T[], cb: (v: T) => Promise<R>): Promise<R[]> {
    let waitings: any = [];
    iterable.forEach(iter => {
        waitings.push(cb(iter));
    });
    return Promise.all(waitings);
}

// noinspection JSUnusedGlobalSymbols
export function hashCode(s: string) {
    let hash = 0;
    if (s.length === 0) return hash;
    for (let i = 0; i < s.length; i++) {
        let character = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + character;
        hash = hash & hash;
    }
    return hash;
}
// noinspection JSUnusedGlobalSymbols
export function djb2Code(str: string) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        let char = str.charCodeAt(i);
        hash = ((hash << 5) + hash) + char; /* hash * 33 + c */
    }
    return hash;
}
// noinspection JSUnusedGlobalSymbols
export function sdbmCode(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        let char = str.charCodeAt(i);
        hash = char + (hash << 6) + (hash << 16) - hash;
    }
    return hash;
}
// noinspection JSUnusedGlobalSymbols
export function loseCode(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash += str.charCodeAt(i);
    }
    return hash;
}

/**
 * Encodes bad html characters in string to codepoint format
 * @param str string to encode
 * @returns encoded string
 */
// noinspection JSUnusedGlobalSymbols
export function encodeHtmlSpecials(str: string) {
    let ret = '';
    for (let i = 0; i < str.length; i++) {
        if (str.codePointAt(i)! > 127)
            ret += `&#${str.codePointAt(i)};`;
        else
            ret += str.charAt(i);
    }
    return ret;
}

function _getGlobal(): any {
    if (typeof window !== "undefined") {
        return window;
    } else if (typeof global !== "undefined") {
        return global;
    } else if (typeof self !== "undefined") {
        return self;
    }
    throw new Error('global not found!');
}
let cachedGlobal: any = null;
/**
 * Returns global, for node it is just global, for browser it is window
 */
export function getGlobal(): any {
    if (cachedGlobal !== null)
        return cachedGlobal;
    return cachedGlobal = _getGlobal();
}

declare var __non_webpack_require__: any;
/**
 * Calls __non_webpack_require__ or plain require to work around webpack,
 * and make still possible to use this in non-webpack code
 * @param module
 */
export function externalRequire(module: string): any {
    const global = getGlobal();
    if (typeof __non_webpack_require__ !== 'undefined') {
        return __non_webpack_require__(module);
    } else if (typeof global.require !== 'undefined') {
        // Webpack hack
        return global[59664743546..toString(36)](module);
    } else {
        throw new Error('require not found!');
    }
}

declare var __webpack_require__: any;
function _isNodeEnvironment(): boolean {
    if (typeof __webpack_require__ === 'function') {
        try {
            // Direct bypass for webpack+terser
            if (process.env.NODE)
                return true;
        } catch (e) { }
    }
    return (typeof process !== 'undefined') && (!!process?.versions?.node);
}
let isNodeEnvironmentCache: any = null;
/**
 * Check if running in node
 */
export function isNodeEnvironment(): boolean {
    if (isNodeEnvironmentCache !== null)
        return isNodeEnvironmentCache;
    return isNodeEnvironmentCache = _isNodeEnvironment();
}
function _isBrowserEnvironment(): boolean {
    if (typeof __webpack_require__ === 'function') {
        try {
            // Direct bypass for webpack+terser
            if (process.env.BROWSER)
                return true;
        } catch (e) { }
    }
    if (typeof window !== 'undefined' && window.document)
        return true;
    return !isNodeEnvironment();
}
let isBrowserEnvironmentCache: any = null;
/**
 * Check if running in browser
 */
export function isBrowserEnvironment(): boolean {
    if (isBrowserEnvironmentCache !== null)
        return isBrowserEnvironmentCache;
    return isBrowserEnvironmentCache = _isBrowserEnvironment();
}

export async function collectCallbacks<T>(cbProvider: (collector: (t: T) => void) => Promise<void>): Promise<T[]> {
    const output: T[] = [];
    const collector = (v: T) => output.push(v);
    await cbProvider(collector);
    return output;
}

export async function repeatBeforeSucceed<V>(fn: () => Promise<V>, maxRepeats: number, repeatIn: number, timeMultiplier: number = 1, maxTime?: number): Promise<V> {
    let repeat = 0;
    if (timeMultiplier < 1) throw new Error(`timeMultiplier (= ${timeMultiplier}) < 1 makes no sense`);
    while (true) {
        try {
            return await fn();
        } catch (e) {
            if (repeat >= maxRepeats)
                throw e;
            if (repeat !== 0 && timeMultiplier != 1) {
                repeatIn = Math.min(repeatIn * timeMultiplier, maxTime ?? Infinity);
            }
            await sleep(repeatIn);
        }
        repeat++;
    }
}

export interface Listener<T> {
    (event: T): any;
}

export interface Disposable {
    dispose(): void;
}

export class TypedEvent<T> {
    private listeners: Listener<T>[] = [];
    private listenersOncer: Listener<T>[] = [];

    on(listener: Listener<T>): Disposable {
        this.listeners.push(listener);
        return {
            dispose: () => this.off(listener)
        };
    }

    once(listener: Listener<T>): void {
        this.listenersOncer.push(listener);
    }

    off(listener: Listener<T>) {
        var callbackIndex = this.listeners.indexOf(listener);
        if (callbackIndex > -1) this.listeners.splice(callbackIndex, 1);
    }

    emit(event: T) {
        this.listeners.forEach((listener) => listener(event));
        if (this.listenersOncer.length > 0) {
            const toCall = this.listenersOncer;
            this.listenersOncer = [];
            toCall.forEach((listener) => listener(event));
        }
    }
    pipe(te: TypedEvent<T>): Disposable {
        return this.on((e) => te.emit(e));
    }
}

export type MaybePromise<T> = Promise<T> | T;

export function isPromise<T>(val: MaybePromise<T>): val is Promise<T> {
    return val instanceof Promise;
}

/**
 * Simple, never expiring in-memory cache
 */
export abstract class PromiseMap<K, V> {
    flushEvent: TypedEvent<[K, V | null]> = new TypedEvent();
    populateEvent: TypedEvent<[K, V | null]> = new TypedEvent();

    protected abstract getPromise(key: K): Promise<V | null>;

    protected normalizeKey: ((key: K) => K) | null = null;
    protected normalizeValue: ((value: V) => V) | null = null;

    protected map: Map<K, Promise<V | null>> = new Map();
    protected resolvedMap: Map<K, V | null> = new Map();

    getIfResolvedPresent(key: K): V | null {
        if (this.normalizeKey) key = this.normalizeKey(key);
        return this.resolvedMap.get(key) ?? null;
    }

    getIfResolvingOrResolvedPresent(key: K): MaybePromise<V | null> {
        if (this.normalizeKey) key = this.normalizeKey(key);
        const resolved = this.resolvedMap.get(key);
        if (resolved) return resolved;
        const resolving = this.map.get(key);
        if (resolving) return resolving;
        return null;
    }

    delete(key: K): boolean {
        if (this.normalizeKey) key = this.normalizeKey(key);
        let found = this.map.delete(key);
        let oldValue;
        if (this.resolvedMap.has(key))
            oldValue = this.resolvedMap.get(key);
        if (this.resolvedMap.delete(key)) found = true;
        if (oldValue !== undefined)
            this.flushEvent.emit([key, oldValue]);
        return found;
    }

    getAll: (keys: K[]) => MaybePromise<(V | null)[]> = this._getAll;

    /**
     * Works great with collapsing queue
     *
     * @param keys
     */
    protected _getAll(keys: K[]): MaybePromise<(V | null)[]> {
        const promises: Promise<void>[] = [];
        const results: (V | null | undefined)[] = new Array(keys.length);
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            if (this.normalizeKey) key = this.normalizeKey(key);
            results[i] = this.resolvedMap.get(key);
            if (results[i] === undefined) {
                promises.push((this.get(key) as Promise<V | null>).then(v => {
                    results[i] = v;
                }));
            }
        }
        if (promises.length === 0)
            return results as (V | null)[];
        return Promise.all(promises).then(() => results as (V | null)[]);
    }

    get: (key: K) => MaybePromise<V | null> = this._get;

    protected _get(key: K): MaybePromise<V | null> {
        if (this.normalizeKey) key = this.normalizeKey(key);
        if (this.resolvedMap.has(key))
            return this.resolvedMap.get(key)!;
        if (!this.map.has(key)) {
            const promise = this.getPromise(key).then(v => (v !== null && this.normalizeValue) ? this.normalizeValue(v) : v);
            this.map.set(key, promise);
            promise.then(v => {
                this.map.delete(key);
                this.resolvedMap.set(key, v);
                this.populateEvent.emit([key, v]);
            });
            promise.catch(_e => {
                this.map.delete(key);
            });
        }
        return this.map.get(key)!;
    }
}
