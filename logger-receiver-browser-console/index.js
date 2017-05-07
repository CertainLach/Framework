import {LOGGER_ACTIONS,BasicReceiver} from '@meteor-it/logger';
import {fixLength} from '@meteor-it/utils';
import * as nodeUtil from 'util';

const colors = {
	reset: ['',''],

	bold: ['text-decoration:bold','text-decoration:none'],
	dim: ['text-decoration:bold','text-decoration:none'],
	italic: ['text-decoration:italic','text-decoration:none'],
	underline: ['text-decoration:underline','text-decoration:none'],
	inverse: ['color:black','text-decoration:none'],
	hidden: ['visible:none','text-decoration:none'],
	strikethrough: ['text-decoration:line-through','text-decoration:none'],

	black: ['color:black','color:black'],
	red: ['color:red','color:black'],
	green: ['color:green','color:black'],
	yellow: ['color:yellow','color:black'],
	blue: ['color:blue','color:black'],
	magenta: ['color:magenta','color:black'],
	cyan: ['color:cyan','color:black'],
	white: ['color:white','color:black'],
	gray: ['color:gray','color:black'],

	bgBlack: ['background:black','background:white'],
	bgRed: ['background:red','background:white'],
	bgGreen: ['background:green','background:white'],
	bgYellow: ['background:yellow','background:white'],
	bgBlue: ['background:blue','background:white'],
	bgMagenta: ['background:magenta','background:white'],
	bgCyan: ['background:cyan','background:white'],
	bgWhite: ['background:white','background:white']
};


///console.clear();
function extractColors(line) {
	let r=[];
	let nl=line.replace(/{(\/?)([^}]+)}/g, (...d) => {
		if (!colors[d[2]])return d[0];
		r.push(colors[d[2]][d[1] === '/' ? 1 : 0]);
		return '%c';
	});
	return [r,nl];
}


export default class BrowserConsoleReceiver extends BasicReceiver {
	nameLimit;

	constructor(nameLimit = 8) {
		super();
		this.nameLimit = nameLimit;
	}

	write(data) {
		let line=nodeUtil.format(data.line,...data.params);
		let colors=extractColors(line);
		line=colors[1];
		colors=colors[0];
		let name=fixLength(data.name, this.nameLimit, true, ' ');
		line='%c'+name+'%c '+line;
		switch (data.type) {
			case LOGGER_ACTIONS.IDENT:
				console._log('%cIDENT',data.name);
				break;
			case LOGGER_ACTIONS.DEENT:
				console._log('DEENT',data.name);
				break;
			case LOGGER_ACTIONS.LOG:
				console._log(line,'color:blue','',...colors);
				break;
			case LOGGER_ACTIONS.ERROR:
				console._log(line,'color:red','',...colors);
				break;
			case LOGGER_ACTIONS.WARNING:
				console._log(line,'color:orange','',...colors);
				break;
			case LOGGER_ACTIONS.DEBUG:
				console._log(line,'color:gray','',...colors);
				break;
			case LOGGER_ACTIONS.TIME_START:
				console._log('TIME_START');
				break;
			case LOGGER_ACTIONS.TIME_END:
				console._log('TIME_END');
				break;
			default:
				console._log('ERROR',data.type,LOGGER_ACTIONS);
		}
		//console._log(data);
	}
}
