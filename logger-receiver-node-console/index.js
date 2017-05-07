import {format} from 'util';
import Logger,{LOGGER_ACTIONS,BasicReceiver} from '@meteor-it/logger';
import {clearScreen, writeStdout, save, restore, writeEscape} from '@meteor-it/terminal';
import {fixLength} from '@meteor-it/utils';
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

if(!process.env.NODE_CONSOLE_DONT_CLEAR)
	clearScreen();

function writeIdent(count, symbolNeeded = false) {
	writeStdout('  '.repeat(symbolNeeded ? count - 1 : count) + ' ' + (symbolNeeded ? symbolNeeded : ''));
}
function writeDate(date) {
	writeEscape('36m');
	writeStdout((new Date(date)).toLocaleTimeString());
	writeEscape('0m');
}
function writeName(limit, name, escapeCode = '44m') {
	writeEscape(escapeCode);
	writeEscape('1m');
	writeStdout(fixLength(name.toString(), limit, true, ' '));
	writeEscape('0m');
	// writeEscape(ansiColors[color][1]);
}
function writeRepeats(count, none = false) {
	if(process.env.NO_COLLAPSE)none=true;
	if (none) {
		writeStdout('      ');
	} else {
		count += 1;
		if (count >= 20) writeEscape('31m'); else if (count >= 5) writeEscape('33m'); else if (count >= 2) writeEscape('32m'); else
			writeEscape('90m');
		if (count >= 999) writeStdout('x999+ '); else if (count === 1) writeStdout('      '); else
			writeStdout('x' + fixLength(count.toString(10), 3, false, ' ') + '  ');
		writeEscape('0m');
	}
}
function writeIdentData(provider, data) {
	writeRepeats(0, true);
	writeDate(data.time);
	writeStdout(' ');
	writeName(provider.nameLimit, data.name);
	writeEscape('35m');
	writeIdent(data.identationLength, '>');
	writeEscape('1m');
	writeStdout(' ' + data.identName);
	writeEscape('0m');
	writeStdout('\n');
}
function writeDeentData(provider, data) {
	writeRepeats(0, true);
	writeDate(data.time);
	writeStdout(' ');
	writeName(provider.nameLimit, data.name);
	writeEscape('35m');
	writeIdent(data.identationLength + 1, '<');
	writeEscape('1m');
	writeStdout(' ' + data.identName);
	writeEscape('22m');
	writeStdout(' (Done in ' + data.identTime + 'ms)');
	writeEscape('0m');
	writeStdout('\n');
}
function writeTimeStartData(provider, data) {
	writeRepeats(0, true);
	writeDate(data.time);
	writeStdout(' ');
	writeEscape('35m');
	writeName(provider.nameLimit, data.name, '1m');
	writeEscape('33m');
	writeIdent(data.identationLength);
	writeStdout(emojiMap['clock face one oclock']);
	writeStdout(' Started '+data.timeName);
	writeStdout('\n');
}
function writeTimeEndData(provider, data) {
	writeRepeats(0, true);
	writeDate(data.time);
	writeStdout(' ');
	writeEscape('35m');
	writeName(provider.nameLimit, data.name, '1m');
	writeEscape('34m');
	writeIdent(data.identationLength);
	writeStdout(emojiMap['clock face six oclock']);
	writeStdout(' Finished '+data.timeName);
	writeEscape('1m');
	writeStdout(' in '+data.timeTime+'ms');
	writeEscape('0m');
	writeStdout('\n');
}
function stringifyData(data) {
	let uncolored = format(data.line, ...data.params || []).emojify();
	return uncolored.replace(/{(\/?)([^}]+)}/g, (...d) => {
		if (!ansiColors[d[2]])return d[0];
		return '\u001B[' + ansiColors[d[2]][d[1] === '/' ? 1 : 0] + 'm';
	});
}
function writeCommonData(escapeCode, provider, data) {
	writeRepeats(data.repeats, false);
	writeDate(data.time);
	writeStdout(' ');
	writeEscape('40m');
	writeName(provider.nameLimit, data.name, escapeCode);
	writeEscape('0m');
	writeIdent(data.identationLength);

	let strings = data.string.split('\n');
	writeStdout(strings.shift());
	writeStdout('\n');
	let dateStrip = (new Date(data.date)).toLocaleTimeString().replace(/./g, ' ');
	strings.forEach(string => {
		writeStdout('     ');
		writeIdent(data.identationLength);
		writeStdout(' '.repeat(provider.nameLimit));
		writeStdout(dateStrip);
		writeStdout(string);
		writeStdout('\n');
	});
	// writeStdout(data.string);
	// writeStdout('\n');
}
function writeLogData(provider, data) {
	writeCommonData('34m', provider, data);
}
function writeErrorData(provider, data) {
	writeCommonData('31m', provider, data);
}
function writeWarningData(provider, data) {
	writeCommonData('33m', provider, data);
}
function writeDebugData(provider, data) {
	writeCommonData('90m', provider, data);
}

export default class NodeConsoleReceiver extends BasicReceiver {
	nameLimit;

	constructor(nameLimit = 8) {
		super();
		this.nameLimit = nameLimit;
	}

	write(data) {
		data.string = stringifyData(data);
		if (data.repeated) {
			if(!process.env.NO_COLLAPSE){
				save();
				writeEscape(data.string.split('\n').length + 'A');
				//data.repeats
			}
		}
		switch (data.type) {
			case LOGGER_ACTIONS.IDENT:
				writeIdentData(this, data);
				break;
			case LOGGER_ACTIONS.DEENT:
				writeDeentData(this, data);
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
				writeTimeStartData(this, data);
				break;
			case LOGGER_ACTIONS.TIME_END:
				writeTimeEndData(this, data);
				break;
			default:
				console._log(data);
		}
		if (data.repeated) {
			if(!process.env.NO_COLLAPSE)restore();
		}
		// console._log(data);
	}
}

let terminalLogger=new Logger('terminal');

process.on('uncaughtException', e => {
	terminalLogger.err(e);
});

process.on('unhandledRejection', e => {
	terminalLogger.err(e);
});

process.on('warning', e => {
	terminalLogger.warn(e);
});