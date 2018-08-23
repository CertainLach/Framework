export declare enum LOGGER_ACTIONS {
    IDENT = 0,
    DEENT = 1,
    LOG = 2,
    WARNING = 3,
    DEPRECATED = 4,
    ERROR = 5,
    DEBUG = 6,
    TIME_START = 7,
    TIME_END = 8,
    PROGRESS = 9,
    PROGRESS_START = 10,
    PROGRESS_END = 11,
    INFO = 2,
    WARN = 3,
    ERR = 5,
}
export declare class BasicReceiver {
    logger: typeof Logger;
    setLogger(logger: typeof Logger): void;
    write(data: any): void;
}
export default class Logger {
    static nameLength: number;
    static repeatCount: number;
    static lastProvider: string;
    static lastMessage: any;
    static lastType: string;
    static receivers: BasicReceiver[];
    name: string;
    identation: string[];
    identationTime: number[];
    times: {
        [key: string]: number;
    };
    static setNameLength(length: number): void;
    constructor(name: string);
    timeStart(name: string): void;
    timeEnd(name: string): void;
    ident(name: string): void;
    deent(): void;
    deentAll(): void;
    isDebugging(): boolean;
    log(...params: any[]): void;
    info(...params: any[]): void;
    warning(...params: any[]): void;
    warn(...params: any[]): void;
    error(...params: any[]): void;
    err(...params: any[]): void;
    debug(...params: any[]): void;
    progress(name: string, progress: boolean | number, info?: string): void;
    static noReceiversWarned: boolean;
    write(data: any): void;
    private static _write(what);
    private static resetRepeating(provider, message, type);
    private static isRepeating(provider, message, type);
    static addReceiver(receiver: BasicReceiver): void;
    static from(name: string | Logger): Logger;
}
export declare type logFunc = (...params: any[]) => undefined;
declare global  {
    interface Console {
        _log: logFunc;
        _error: logFunc;
        _warn: logFunc;
        _err: logFunc;
        _warning: logFunc;
    }
}
export {};
