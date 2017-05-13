import {format} from 'util';
import Logger,{LOGGER_ACTIONS,BasicReceiver} from '@meteor-it/logger';
import {MongoClient} from 'mongodb';

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
	blue: ['color:lightblue','color:black'],
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
function stringifyData(data) {
	let uncolored = format(data.line, ...data.params || []).emojify();
	let nl=uncolored.replace(/{(\/?)([^}]+)}/g, (...d) => {
		if (!colors[d[2]])return d[0];
		if(d[1]!=='/'){
			return `<div style="${colors[d[2]][0]}">`;
		}else{
			return '</div>';
		}
	});
	nl=nl.replace(/\n/g,'<br>');
	return nl;
}


export default class NodeMongoReceiver extends BasicReceiver {
	nameLimit;
	db;

	constructor(mongoUrl) {
		super();
		MongoClient.connect(mongoUrl, (err, db)=>{
			if(err)
				return console._log(err.stack);
			this.db=db;
		});
	}

	write(data) {
		if(!this.db)
			return;
		data.string = stringifyData(data);
		delete data.line;
		delete data.params;
		
		switch (data.type) {
			case LOGGER_ACTIONS.IDENT:
				data.type='II';
				break;
			case LOGGER_ACTIONS.DEENT:
				data.type='ID';
				break;
			case LOGGER_ACTIONS.LOG:
				data.type='LL';
				break;
			case LOGGER_ACTIONS.ERROR:
				data.type='LE';
				break;
			case LOGGER_ACTIONS.WARNING:
				data.type='LW';
				break;
			case LOGGER_ACTIONS.DEBUG:
				data.type='LD';
				break;
			case LOGGER_ACTIONS.TIME_START:
				data.type='TS';
				break;
			case LOGGER_ACTIONS.TIME_END:
				data.type='TE';
				break;
			default:
				return console._log(data);
		}
		this.db.collection('log').insertMany([
			data
		], function(err, result) {
			if(err)
				return console._log(data);
		});
	}
}
