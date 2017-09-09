import './colors';

let cluster=null;
/*global __NODE__*/
if(__NODE__){
	cluster=require('cluster'); //cluster
}else{
	cluster={
		isMaster:true,
		isWorker:false,
		on(){},
		emit(){}
	};
}

const DEBUG = process.env.DEBUG||'';

export enum LOGGER_ACTIONS{
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
    INFO=LOGGER_ACTIONS.LOG,
    WARN=LOGGER_ACTIONS.WARNING,
    ERR=LOGGER_ACTIONS.ERROR
}

const REPEATABLE_ACTIONS=[
    LOGGER_ACTIONS.IDENT,
    LOGGER_ACTIONS.DEENT,
    LOGGER_ACTIONS.TIME_START,
    LOGGER_ACTIONS.TIME_END,
	LOGGER_ACTIONS.PROGRESS,
	LOGGER_ACTIONS.PROGRESS_START,
	LOGGER_ACTIONS.PROGRESS_END
];

let consoleLogger;
let loggerLogger;

declare global {
    interface Global {
        __LOGGER:any;
    }
    interface Console {
        _log(...pars:any[]):any;
        _warn(...pars:any[]):any;
        _err(...pars:any[]):any;
        err(...pars:any[]):any;
        warning(...pars:any[]):any;
        _error(...pars:any[]):any;
        _warning(...pars:any[]):any;
    }
}

if((<any>global).__LOGGER)
	throw new Error('You have more than 1 logger installed! Make sure you use only latest versions of it, and/or reinstall dependencies');
(<any>global).__LOGGER=1;

export class BasicReceiver {
	logger;

	setLogger(logger){
		this.logger=logger;
	}
	write(data) {
		throw new Error('write(): Not implemented!');
	}
}

/**
 * Powerfull logger. Exists from second generation of "ayzek"
 */
export default class Logger {
	static nameLength = 12;
	static repeatCount;
	static lastProvider;
	static lastMessage;
	static lastType;
	static receivers = [];
	name;
	identation = [];
	identationTime=[];
	times={};

	static setNameLength(length) {
		Logger.nameLength = length;
	}
	constructor(name) {
		this.name = name.toUpperCase();
	}
	timeStart(name) {
		if(this.times[name]){
			loggerLogger.warn('timeStart(%s) called 2 times with same name!',name);
			return;
		}
		this.times[name]=new Date().getTime();
		this.write({
			type: LOGGER_ACTIONS.TIME_START,
			timeName: name
		});
	}
	timeEnd(name) {
		if(!this.times[name]){
			loggerLogger.warn('timeEnd(%s) called with unknown name!',name);
			return;
		}
		this.write({
			type: LOGGER_ACTIONS.TIME_END,
			timeName: name,
			timeTime: new Date().getTime()-this.times[name]
		});
		delete this.times[name];
	}
	ident(name) {
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
			identTime: new Date().getTime()-this.identationTime.pop()
		});
	}
	deentAll(){
		while(this.identation.length>0){
			this.deent();
		}
	}

	// LOG
	log(...params) {
		this.write({
			type: LOGGER_ACTIONS.LOG,
			line: params.shift(),
			params: params
		});
	}
	info(...params) {
		this.write({
			type: LOGGER_ACTIONS.LOG,
			line: params.shift(),
			params: params
		});
	}
	// WARNING
	warning(...params) {
		this.write({
			type: LOGGER_ACTIONS.WARNING,
			line: params.shift(),
			params: params
		});
	}
	warn(...params) {
		this.write({
			type: LOGGER_ACTIONS.WARNING,
			line: params.shift(),
			params: params
		});
	}
	error(...params) {
		this.write({
			type: LOGGER_ACTIONS.ERROR,
			line: params.shift(),
			params: params
		});
	}
	err(...params) {
		this.write({
			type: LOGGER_ACTIONS.ERROR,
			line: params.shift(),
			params: params
		});
	}
	// DEBUG
	debug(...params) {
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
	progress(name,progress:boolean|number,info?:string){
		if(progress===true) {
            this.write({
                type: LOGGER_ACTIONS.PROGRESS_START,
				name
            });
        }else if(progress===false){
            this.write({
                type: LOGGER_ACTIONS.PROGRESS_END,
				name
            });
		}else{
            this.write({
                type: LOGGER_ACTIONS.PROGRESS,
                name,
				progress,
				info
            });
		}
	}
	static noReceiversWarned = false;
	write(data) {
		if (!data.time)
			data.time = new Date().getTime();
		if (!data.name)
			data.name = this.name;
		if (!data.identationLength)
			data.identationLength = this.identation.length;
		Logger._write(data);
	}
	static _write(what) {
		if(cluster.isWorker){
            process.send({
				loggerAction: what
            });
		}else {
            if (Logger.receivers.length === 0) {
                if (!Logger.noReceiversWarned) {
                    console._log('No receivers are defined for logger! See docs for info about this!');
                    Logger.noReceiversWarned = true;
                }
                switch (what.type){
                    case LOGGER_ACTIONS.DEBUG:
                    case LOGGER_ACTIONS.LOG:
                        console._log(what.line,...what.params);
                        break;
                    case LOGGER_ACTIONS.ERROR:
                        console._error(what.line,...what.params);
                        break;
                    case LOGGER_ACTIONS.WARNING:
                        console._warn(what.line,...what.params);
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
	}
	static resetRepeating(provider, message, type) {
		Logger.lastProvider = provider;
		Logger.lastMessage = message;
		Logger.lastType = type;
		Logger.repeatCount = 0;
	}
	static isRepeating(provider, message, type) {
		return Logger.lastProvider === provider && Logger.lastMessage === message && Logger.lastType === type;
	}
	static addReceiver(receiver) {
		if (Logger.receivers.length === 4)
			loggerLogger.warn('Possible memory leak detected: 4 or more receivers are added.');
		receiver.setLogger(Logger);
		Logger.receivers.push(receiver);
	}
}
if(cluster.isMaster){
    cluster.on('message', (worker,msg)=>{
        if(!(msg as any).loggerAction)
            return;
        Logger._write((msg as any).loggerAction);
    });
}

consoleLogger = new Logger('console');
loggerLogger = new Logger('logger'); // Like in java :D
for (let method of['log', 'error', 'warn', 'err','warning']) {
	console['_' + method] = console[method];
	console[method] = (...args) => consoleLogger[method](...args);
}
