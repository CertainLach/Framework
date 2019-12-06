export enum LOGGER_ACTIONS {
	IDENT,
	DEENT,
	LOG,
	WARNING,
	ERROR,
	DEBUG,
	TIME_START,
	TIME_END,
	PROGRESS,
	PROGRESS_START,
	PROGRESS_END
}
export type CommonLogAction<E> = {
	type: E,
	params: any[]
}
/**
 * Normal log action
 */
export type InfoLogAction = CommonLogAction<LOGGER_ACTIONS.LOG>
/**
 * Special effect: Logged in stderr instead of stdout
 */
export type WarningLogAction = CommonLogAction<LOGGER_ACTIONS.WARNING>
/**
 * Special effect: Logged in stderr instead of stdout
 */
export type ErrorLogAction = CommonLogAction<LOGGER_ACTIONS.ERROR>
/**
 * Special effect: Debug log action willn't be logged, if name isn't specified in DEBUG env variable
 */
export type DebugLogAction = CommonLogAction<LOGGER_ACTIONS.DEBUG>
export type IdentAction = {
	type: LOGGER_ACTIONS.IDENT;
	identName: string;
}
export type DeentAction = {
	type: LOGGER_ACTIONS.DEENT;
	identName: string;
	identTime: number;
}
export type TimeStartAction = {
	type: LOGGER_ACTIONS.TIME_START;
	timeName: string;
}
export type TimeEndAction = {
	type: LOGGER_ACTIONS.TIME_END;
	timeName: string;
	timeTime: number;
}
export type ProgressStartAction = {
	type: LOGGER_ACTIONS.PROGRESS_START
}
export type ProgressEndAction = {
	type: LOGGER_ACTIONS.PROGRESS_END
}
export type ProgressAction = {
	type: LOGGER_ACTIONS.PROGRESS,
	info?: string,
	progress: number
}
export type LoggerAction = {
	repeats?: number,
	repeated?: boolean,
	name?: string,
	line?: string,
	time?: number,
	identationLength?: number
} & (
		IdentAction | DeentAction |
		InfoLogAction | WarningLogAction | ErrorLogAction | DebugLogAction |
		TimeStartAction | TimeEndAction |
		ProgressStartAction | ProgressEndAction | ProgressAction
	);

const REPEATABLE_ACTIONS = [
	LOGGER_ACTIONS.IDENT,
	LOGGER_ACTIONS.DEENT,
	LOGGER_ACTIONS.TIME_START,
	LOGGER_ACTIONS.TIME_END,
	LOGGER_ACTIONS.PROGRESS,
	LOGGER_ACTIONS.PROGRESS_START,
	LOGGER_ACTIONS.PROGRESS_END
];

let loggerLogger: Logger;

export class BasicReceiver {
	logger?: typeof Logger;

	setLogger(logger: typeof Logger) {
		this.logger = logger;
	}

	write(_data: LoggerAction) {
		throw new Error('write(): Not implemented!');
	}
}

// TODO: Logger UUID
export default class Logger {
	static nameLength = 12;
	static repeatCount: number;
	static lastProvider: string;
	static lastMessage: any;
	static lastType: LOGGER_ACTIONS;
	static receivers: BasicReceiver[] = [];
	name: string;
	identation: string[] = [];
	identationTime: number[] = [];
	times: { [key: string]: number } = {};

	static setNameLength(length: number) {
		Logger.nameLength = length;
	}
	constructor(name: string) {
		this.name = name.toUpperCase();
	}
	timeStart(name: string) {
		if (this.times[name]) {
			loggerLogger.warn('timeStart(%s) called 2 times with same name!', name);
			return;
		}
		this.times[name] = new Date().getTime();
		this._write({
			type: LOGGER_ACTIONS.TIME_START,
			timeName: name
		});
	}
	timeEnd(name: string) {
		if (!this.times[name]) {
			loggerLogger.warn('timeEnd(%s) called with unknown name!', name);
			return;
		}
		this._write({
			type: LOGGER_ACTIONS.TIME_END,
			timeName: name,
			timeTime: new Date().getTime() - this.times[name]
		});
		delete this.times[name];
	}
	ident(name: string) {
		this.identation.push(name);
		this.identationTime.push(new Date().getTime());
		this._write({
			type: LOGGER_ACTIONS.IDENT,
			identName: name
		});
	}
	deent() {
		if (this.identation.length === 0) {
			return;
		}
		this._write({
			type: LOGGER_ACTIONS.DEENT,
			identName: this.identation.pop()!,
			identTime: new Date().getTime() - this.identationTime.pop()!
		});
	}
	deentAll() {
		while (this.identation.length > 0) {
			this.deent();
		}
	}

	// LOG
	log(...params: any[]) {
		this._write({
			type: LOGGER_ACTIONS.LOG,
			line: params.shift(),
			params: params
		});
	}
	info(...params: any[]) {
		this._write({
			type: LOGGER_ACTIONS.LOG,
			line: params.shift(),
			params: params
		});
	}
	// WARNING
	warning(...params: any[]) {
		this._write({
			type: LOGGER_ACTIONS.WARNING,
			line: params.shift(),
			params: params
		});
	}
	warn(...params: any[]) {
		this._write({
			type: LOGGER_ACTIONS.WARNING,
			line: params.shift(),
			params: params
		});
	}
	error(...params: any[]) {
		this._write({
			type: LOGGER_ACTIONS.ERROR,
			line: params.shift(),
			params: params
		});
	}
	err(...params: any[]) {
		this._write({
			type: LOGGER_ACTIONS.ERROR,
			line: params.shift(),
			params: params
		});
	}
	// DEBUG
	debug(...params: any[]) {
		this._write({
			type: LOGGER_ACTIONS.DEBUG,
			line: params.shift(),
			params: params
		});
	}
	// Progress
	progress(name: string, progress: boolean | number, info?: string) {
		if (progress === true) {
			this._write({
				type: LOGGER_ACTIONS.PROGRESS_START,
				name
			});
		} else if (progress === false) {
			this._write({
				type: LOGGER_ACTIONS.PROGRESS_END,
				name
			});
		} else {
			this._write({
				type: LOGGER_ACTIONS.PROGRESS,
				name,
				progress,
				info
			});
		}
	}
	static noReceiversWarned = false;
	_write(data: LoggerAction) {
		if (!data.time)
			data.time = new Date().getTime();
		if (!data.name)
			data.name = this.name;
		if (!data.identationLength)
			data.identationLength = this.identation.length;
		Logger.__write(data);
	}
	private static __write(what: LoggerAction) {
		if (Logger.receivers.length === 0) {
			if (!Logger.noReceiversWarned) {
				console._log('No receivers are defined for logger!\nSee docs for @meteor-it/logger for more info!');
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
		if (what.name && what.line) {
			if (Logger.isRepeating(what.name, what.line, what.type))
				Logger.repeatCount++;
			else
				Logger.resetRepeating(what.name, what.line, what.type);
		}
		if (REPEATABLE_ACTIONS.indexOf(what.type) === -1)
			what.repeats = Logger.repeatCount;
		what.repeated = (what?.repeats! ?? 0) > 0;
		Logger.receivers.forEach(receiver => receiver.write(what));
	}
	private static resetRepeating(provider: string, message: string, type: LOGGER_ACTIONS) {
		Logger.lastProvider = provider;
		Logger.lastMessage = message;
		Logger.lastType = type;
		Logger.repeatCount = 0;
	}
	private static isRepeating(provider: string, message: string, type: LOGGER_ACTIONS) {
		return Logger.lastProvider === provider && Logger.lastMessage === message && Logger.lastType === type;
	}
	static addReceiver(receiver: BasicReceiver) {
		if (Logger.receivers.length === 4)
			loggerLogger.warn('Possible memory leak detected: 4 or more receivers are added.');
		receiver.setLogger(Logger);
		Logger.receivers.push(receiver);
	}
	static from(name: string | Logger): Logger {
		if (name instanceof Logger)
			return name;
		// From logger of another version? Should be avoided in any way
		if (typeof name === 'object' && 'timeStart' in (name as any))
			return name;
		return new Logger(name);
	}
}

loggerLogger = new Logger('logger');

export type logFunc = (...params: any[]) => undefined;
declare global {
	interface Console {
		_log: logFunc;
		_error: logFunc;
		_warn: logFunc;
		_err: logFunc;
		_warning: logFunc;
	}
}
