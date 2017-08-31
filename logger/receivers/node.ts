import {format} from 'util';
import Logger,{LOGGER_ACTIONS,BasicReceiver} from '../';
import {clearScreen, writeStdout, writeEscape} from '@meteor-it/terminal';
import emojiMap from '@meteor-it/emoji';

const ansiColors = {
	reset: [0, 0],

	bold: [1, 22],
	dim: [2, 22],
	italic: [3, 23],
	underline: [4, 24],
	inverse: [7, 27],
	hidden: [8, 28],
	strikethrough: [9, 29],

	black: [30, 39],
	red: [31, 39],
	green: [32, 39],
	yellow: [33, 39],
	blue: [34, 39],
	magenta: [35, 39],
	cyan: [36, 39],
	white: [37, 39],
	gray: [90, 39],

	bgBlack: [40, 49],
	bgRed: [41, 49],
	bgGreen: [42, 49],
	bgYellow: [43, 49],
	bgBlue: [44, 49],
	bgMagenta: [45, 49],
	bgCyan: [46, 49],
	bgWhite: [47, 49]
};

// if(!process.env.NODE_CONSOLE_DONT_CLEAR)
// 	clearScreen();

function stringifyIdent(count, symbolNeeded = undefined) {
	return `${'  '.repeat(symbolNeeded ? count - 1 : count)} ${symbolNeeded ? symbolNeeded : ''}`;
}
// function writeDate(date) {
// 	// writeEscape('36m');
// 	// writeStdout((new Date(date)).toLocaleTimeString());
// 	// writeEscape('0m');
// }
function stringifyName(limit, name, escapeCode = '44m') {
	return `\u001B[${escapeCode}\u001B[1m${name.toString().padStart(16,' ')}\u001B[0m`;
}
// function writeRepeats(count, none = false) {
// 	// if(process.env.NO_COLLAPSE)none=true;
// 	// if (none) {
// 	// 	writeStdout('      ');
// 	// } else {
// 	// 	count += 1;
// 	// 	if (count >= 20) writeEscape('31m'); else if (count >= 5) writeEscape('33m'); else if (count >= 2) writeEscape('32m'); else
// 	// 		writeEscape('90m');
// 	// 	if (count >= 999) writeStdout('x999+ '); else if (count === 1) writeStdout('      '); else
// 	// 		writeStdout('x' + fixLength(count.toString(10), 3, false, ' ') + '  ');
// 	// 	writeEscape('0m');
// 	// }
// }
function stringifyIdentData(provider, data) {
	// writeRepeats(0, true);
	// writeDate(data.time);
	return ` ${stringifyName(provider.nameLimit,data.name)} \u001B[35m${stringifyIdent(data.identationLength,'>')}\u001B[1m ${data.identName}\u001B[0m\n`;
}
function stringifyDeentData(provider, data) {
	// writeRepeats(0, true);
	// writeDate(data.time);
	return ` ${stringifyName(provider.nameLimit,data.name)} \u001B[35m${stringifyIdent(data.identationLength+1,'<')}\u001B[1m ${data.identName}\u001B[22m (Done in ${data.identTime}ms)\u001B[0m\n`;
}
function stringifyTimeStartData(provider, data) {
	// writeRepeats(0, true);
	// writeDate(data.time);
	return ` \u001B[35m${stringifyName(provider.nameLimit,data.name,'1m')}\u001B[33m${stringifyIdent(data.identationLength)}${emojiMap['clock face one oclock']} Started ${data.timeName}\n`;
}
function stringifyTimeEndData(provider, data) {
	// writeRepeats(0, true);
	// writeDate(data.time);
	return ` \u001B[35m${stringifyName(provider.nameLimit,data.name,'1m')}\u001B[34m${stringifyIdent(data.identationLength)}${emojiMap['clock face six oclock']} Finished ${data.timeName}\u001B[1m in ${data.timeTime}ms\u001B[0m\n`;
}
function stringifyData(data) {
	let uncolored = format(data.line, ...data.params || []).emojify();
	return uncolored.replace(/{(\/?)([^}]+)}/g, (...d) => {
		if (!ansiColors[d[2]])return d[0];
		return '\u001B[' + ansiColors[d[2]][d[1] === '/' ? 1 : 0] + 'm';
	});
}
const STRIPPED_DATE=(new Date()).toLocaleTimeString().replace(/./g, ' ');
function stringifyCommonData(escapeCode, provider, data) {
	// writeRepeats(data.repeats, false);
	// writeDate(data.time);
	const strings = data.string.split('\n');
	let ret = ` \u001B[40m${stringifyName(provider.nameLimit, data.name, escapeCode)}\u001B[0m${stringifyIdent(data.identationLength)}`+
	`${strings.shift()}\n`;
	for(let string of strings){
		ret += `${stringifyIdent(data.identationLength)}${stringifyName(provider.nameLimit,'|',escapeCode)} ${string}\n`;
	}
	return ret;
}
function writeLogData(provider, data) {
	writeStdout(stringifyCommonData('34m',provider,data));
}
function writeErrorData(provider, data) {
	writeStdout(stringifyCommonData('31m',provider,data));
}
function writeWarningData(provider, data) {
	writeStdout(stringifyCommonData('33m',provider,data));
}
function writeDebugData(provider, data) {
	writeStdout(stringifyCommonData('90m',provider,data));
}

export default class NodeConsoleReceiver extends BasicReceiver {
	nameLimit;

	constructor(nameLimit = 16) {
		super();
		this.nameLimit = nameLimit;
	}

	write(data) {
		data.string = stringifyData(data);
		// if (data.repeated) {
		// 	if(!process.env.NO_COLLAPSE){
		// 		save();
		// 		writeEscape(data.string.split('\n').length + 'A');
		// 		//data.repeats
		// 	}
		// }
		switch (data.type) {
			case LOGGER_ACTIONS.IDENT:
				writeStdout(stringifyIdentData(this, data));
				break;
			case LOGGER_ACTIONS.DEENT:
				writeStdout(stringifyDeentData(this, data));
				break;
			case LOGGER_ACTIONS.LOG:
				writeLogData(this, data);
				break;
			case LOGGER_ACTIONS.ERROR:
				writeErrorData(this, data);
				break;
			case LOGGER_ACTIONS.WARNING:
				writeWarningData(this, data);
				break;
			case LOGGER_ACTIONS.DEBUG:
				writeDebugData(this, data);
				break;
			case LOGGER_ACTIONS.TIME_START:
				writeStdout(stringifyTimeStartData(this, data));
				break;
			case LOGGER_ACTIONS.TIME_END:
				writeStdout(stringifyTimeEndData(this, data));
				break;
			default:
				console._log(data);
		}
		// if (data.repeated) {
		// 	if(!process.env.NO_COLLAPSE)restore();
		// }
		// console._log(data);
	}
}

let terminalLogger=new Logger('terminal');

process.on('uncaughtException', e => {
	terminalLogger.err(e.stack);
});

process.on('unhandledRejection', e => {
	terminalLogger.err(e.stack);
});

// process.on('warning', e => {
// 	terminalLogger.warn(e.stack);
// });