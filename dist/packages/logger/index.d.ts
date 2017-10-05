import './colors';
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
    logger: any;
    setLogger(logger: any): void;
    write(data: any): void;
}
export default class Logger {
    static nameLength: number;
    static repeatCount: any;
    static lastProvider: any;
    static lastMessage: any;
    static lastType: any;
    static receivers: any[];
    name: any;
    identation: any[];
    identationTime: any[];
    times: {};
    static setNameLength(length: any): void;
    constructor(name: any);
    timeStart(name: any): void;
    timeEnd(name: any): void;
    ident(name: any): void;
    deent(): void;
    deentAll(): void;
    log(...params: any[]): void;
    info(...params: any[]): void;
    warning(...params: any[]): void;
    warn(...params: any[]): void;
    error(...params: any[]): void;
    err(...params: any[]): void;
    debug(...params: any[]): void;
    progress(name: any, progress: boolean | number, info?: string): void;
    static noReceiversWarned: boolean;
    write(data: any): void;
    static _write(what: any): void;
    static resetRepeating(provider: any, message: any, type: any): void;
    static isRepeating(provider: any, message: any, type: any): boolean;
    static addReceiver(receiver: any): void;
}
