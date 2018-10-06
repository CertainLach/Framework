const DEBUG = process.env.DEBUG || '';

export enum LOGGER_ACTIONS {
	IDENT,
	DEENT,
	LOG,
	WARNING,
	DEPRECATED,
	ERROR,
	DEBUG,
	TIME_START,
	TIME_END,
	PROGRESS,
	PROGRESS_START,
	PROGRESS_END,
	INFO = LOGGER_ACTIONS.LOG,
	WARN = LOGGER_ACTIONS.WARNING,
	ERR = LOGGER_ACTIONS.ERROR
}

const REPEATABLE_ACTIONS = [
	LOGGER_ACTIONS.IDENT,
	LOGGER_ACTIONS.DEENT,
	LOGGER_ACTIONS.TIME_START,
	LOGGER_ACTIONS.TIME_END,
	LOGGER_ACTIONS.PROGRESS,
	LOGGER_ACTIONS.PROGRESS_START,
	LOGGER_ACTIONS.PROGRESS_END
];

let consoleLogger:Logger;
let loggerLogger:Logger;

export class BasicReceiver {
	logger:typeof Logger;

	setLogger(logger:typeof Logger) {
		this.logger = logger;
	}
	write(data:any) {
		throw new Error('write(): Not implemented!');
	}
}

export default class Logger {
	static nameLength = 12;
	static repeatCount:number;
	static lastProvider:string;
	static lastMessage:any;
	static lastType:string;
	static receivers:BasicReceiver[] = [];
	name:string;
	identation:string[] = [];
	identationTime:number[] = [];
	times:{[key:string]:number} = {};

	static setNameLength(length:number) {
		Logger.nameLength = length;
	}
	constructor(name:string) {
		this.name = name.toUpperCase();
	}
	timeStart(name:string) {
		if (this.times[name]) {
			loggerLogger.warn('timeStart(%s) called 2 times with same name!', name);
			return;
		}
		this.times[name] = new Date().getTime();
		this.write({
			type: LOGGER_ACTIONS.TIME_START,
			timeName: name
		});
	}
	timeEnd(name:string) {
		if (!this.times[name]) {
			loggerLogger.warn('timeEnd(%s) called with unknown name!', name);
			return;
		}
		this.write({
			type: LOGGER_ACTIONS.TIME_END,
			timeName: name,
			timeTime: new Date().getTime() - this.times[name]
		});
		delete this.times[name];
	}
	ident(name:string) {
		this.identation.push(name);
		this.identationTime.push(new Date().getTime());
		this.write({
			type: LOGGER_ACTIONS.IDENT,
			identName: name
		});
	}
	deent() {
		if (this.identation.length === 0) {
			return;
		}
		this.write({
			type: LOGGER_ACTIONS.DEENT,
			identName: this.identation.pop(),
			identTime: new Date().getTime() - this.identationTime.pop()
		});
	}
	deentAll() {
		while (this.identation.length > 0) {
			this.deent();
		}
	}
	isDebugging():boolean{
        return DEBUG === '*' || DEBUG.split(',').indexOf(this.name)!==-1
    }

	// LOG
	log(...params:any[]) {
		this.write({
			type: LOGGER_ACTIONS.LOG,
			line: params.shift(),
			params: params
		});
	}
	info(...params:any[]) {
		this.write({
			type: LOGGER_ACTIONS.LOG,
			line: params.shift(),
			params: params
		});
	}
	// WARNING
	warning(...params:any[]) {
		this.write({
			type: LOGGER_ACTIONS.WARNING,
			line: params.shift(),
			params: params
		});
	}
	warn(...params:any[]) {
		this.write({
			type: LOGGER_ACTIONS.WARNING,
			line: params.shift(),
			params: params
		});
	}
	error(...params:any[]) {
		this.write({
			type: LOGGER_ACTIONS.ERROR,
			line: params.shift(),
			params: params
		});
	}
	err(...params:any[]) {
		this.write({
			type: LOGGER_ACTIONS.ERROR,
			line: params.shift(),
			params: params
		});
	}
	// DEBUG
	debug(...params:any[]) {
		//if(DEBUG === '-')
		//	return;
		if (DEBUG === '*' || ~DEBUG.split(',').indexOf(this.name))
			this.write({
				type: LOGGER_ACTIONS.DEBUG,
				line: params.shift(),
				params: params
			});
	}
	// Progress
	progress(name:string, progress: boolean | number, info?: string) {
		if (progress === true) {
			this.write({
				type: LOGGER_ACTIONS.PROGRESS_START,
				name
			});
		} else if (progress === false) {
			this.write({
				type: LOGGER_ACTIONS.PROGRESS_END,
				name
			});
		} else {
			this.write({
				type: LOGGER_ACTIONS.PROGRESS,
				name,
				progress,
				info
			});
		}
	}
	static noReceiversWarned = false;
	write(data:any) {
		if (!data.time)
			data.time = new Date().getTime();
		if (!data.name)
			data.name = this.name;
		if (!data.identationLength)
			data.identationLength = this.identation.length;
		Logger._write(data);
	}
	private static _write(what:any) {
		if (Logger.receivers.length === 0) {
			if (!Logger.noReceiversWarned) {
				console._log('No receivers are defined for logger! See docs for info about this!');
				Logger.noReceiversWarned = true;
			}
			switch (what.type) {
				case LOGGER_ACTIONS.DEBUG:
				case LOGGER_ACTIONS.LOG:
					console._log(what.line, ...what.params);
					break;
				case LOGGER_ACTIONS.ERROR:
					console._error(what.line, ...what.params);
					break;
				case LOGGER_ACTIONS.WARNING:
					console._warn(what.line, ...what.params);
					break;
				default:
					console._log(what);
			}
			return;
		}
		if (Logger.isRepeating(what.name, what.line, what.type))
			Logger.repeatCount++;
		else
			Logger.resetRepeating(what.name, what.line, what.type);
		if (REPEATABLE_ACTIONS.indexOf(what.type) === -1)
			what.repeats = Logger.repeatCount;
		what.repeated = what.repeats && what.repeats > 0;
		Logger.receivers.forEach(receiver => receiver.write(what));
	}
    private static resetRepeating(provider:string, message:string, type:string) {
		Logger.lastProvider = provider;
		Logger.lastMessage = message;
		Logger.lastType = type;
		Logger.repeatCount = 0;
	}
    private static isRepeating(provider:string, message:string, type:string) {
		return Logger.lastProvider === provider && Logger.lastMessage === message && Logger.lastType === type;
	}
	static addReceiver(receiver:BasicReceiver) {
		if (Logger.receivers.length === 4)
			loggerLogger.warn('Possible memory leak detected: 4 or more receivers are added.');
		receiver.setLogger(Logger);
		Logger.receivers.push(receiver);
	}
	static from(name:string|Logger):Logger {
	    if(name instanceof Logger)
			return name;
		// From logger of another version? Should be avoided in any way
		if(typeof name==='object'&&'timeStart' in (name as any))
			return name;
	    return new Logger(name);
    }
}

// Console monkey-patching
// And named console support
const OTHER_LOGGER_MARK  = /^\[([a-zA-Z]+)\]/;

consoleLogger = new Logger('console');
(consoleLogger as any).___write = consoleLogger.write;
consoleLogger.write = (data:any)=>{
	if(typeof data.line==='string'&&OTHER_LOGGER_MARK.test(data.line)){
		data.name = data.line.match(OTHER_LOGGER_MARK);
		data.line = data.line.replace(OTHER_LOGGER_MARK,'').trimStart();
	}
	return (consoleLogger as any).___write(data);
}
loggerLogger = new Logger('logger');
export type logFunc=(...params:any[])=>undefined;
declare global {
    interface Console {
        _log:logFunc;
        _error:logFunc;
        _warn:logFunc;
        _err:logFunc;
        _warning:logFunc;
    }
}
if (!(console as any)._patchedByLogger) {
	for (let method of ['log', 'error', 'warn', 'err', 'warning', 'info']) {
		(console as any)['_' + method] = (console as any)[method];
        (console as any)[method] = (...args:any[]) => (consoleLogger as any)[method](...args);
	}
    (console as any)._patchedByLogger = true;
}
