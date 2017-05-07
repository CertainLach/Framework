import './colors';
import {isBrowser,isNode} from '@meteor-it/platform';
import {createPrivateEnum} from '@meteor-it/utils';

const LOG_TRACE = (isBrowser ? window.localStorage.getItem('LOG_TRACE') : process.env.LOG_TRACE)||false;
const DEBUG = (isBrowser ? window.localStorage.getItem('DEBUG') : process.env.DEBUG)||'-';

export const LOGGER_ACTIONS = createPrivateEnum('IDENT', 'DEENT', 'LOG', 'WARNING', 'DEPRECATED', 'ERROR', 'DEBUG', 'TIME_START','TIME_END');
const REPEATABLE_ACTIONS=[LOGGER_ACTIONS.IDENT,LOGGER_ACTIONS.DEENT,LOGGER_ACTIONS.TIME_START,LOGGER_ACTIONS.TIME_END];
LOGGER_ACTIONS.INFO = LOGGER_ACTIONS.LOG;
LOGGER_ACTIONS.WARN = LOGGER_ACTIONS.WARNING;
LOGGER_ACTIONS.ERR = LOGGER_ACTIONS.ERROR;

let consoleLogger;
let loggerLogger;

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
	info(...args) {
		this.log(...args);
	}
	// WARNING
	warning(...params) {
		this.write({
			type: LOGGER_ACTIONS.WARNING,
			line: params.shift(),
			params: params
		});
	}
	warn(...args) {
		this.warning(...args);
	}
	deprecationWarning(...params) {
		this.write({
			type: LOGGER_ACTIONS.DEPRECATED,
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
	err(...args) {
		this.error(...args);
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
		if (this.receivers.length === 0) {
			if(!this.noReceiversWarned){
				console._log('No receivers are defined for logger!');
				this.noReceiversWarned = true;
			}
			console._log(what);
		}
		if(this.isRepeating(what.name,what.line,what.type))
			this.repeatCount++;
		else
			this.resetRepeating(what.name,what.line,what.type);
		if(REPEATABLE_ACTIONS.indexOf(what.type)===-1)
			what.repeats=this.repeatCount;
		what.repeated=what.repeats&&what.repeats>0;
		this.receivers.forEach(receiver => receiver.write(what));
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
		if (this.receivers.length === 4)
			loggerLogger.warn('Possible memory leak detected: 4 or more receivers are added.');
		receiver.setLogger(Logger);
		this.receivers.push(receiver);
	}
}

consoleLogger = new Logger('console');
loggerLogger = new Logger('logger'); // Like in java :D
for (let method of['log', 'error', 'warn']) {
	console['_' + method] = console[method];
	console[method] = (...args) => consoleLogger[method](...args);
}

if(isBrowser){
	try{
		Logger.addReceiver(new (require('@meteor-it/logger'+'-receiver-browser-console').default)());
	}catch(e){
		console.error('Logger receiver for browser is not installed!');
	}
}
if(isNode){
	try{
		Logger.addReceiver(new (require('@meteor-it/logger'+'-receiver-node-console').default)());
	}catch(e){
		console.log(e.stack);
		console.error('Logger receiver for node is not installed!');
	}
}
