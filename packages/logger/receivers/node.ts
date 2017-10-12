import {format} from 'util';
import Logger,{LOGGER_ACTIONS,BasicReceiver} from '../';
import {clearScreen, writeStdout, writeEscape,
    moveCursor, clearLine, save, restore, startBuffering, flushBuffer} from '@meteor-it/terminal';
import {start} from "repl";

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

function stringifyIdent(nameLimit, count, symbolNeeded = undefined) {
	return `${'  '.repeat(count)}${symbolNeeded ? symbolNeeded : ' '}`;
}
// function writeDate(date) {
// 	// writeEscape('36m');
// 	// writeStdout((new Date(date)).toLocaleTimeString());
// 	// writeEscape('0m');
// }
function stringifyName(nameLimit, limit, name, escapeCode = '44m') {
	return `\u001B[${escapeCode}\u001B[1m${nameLimit===0?'':name.toString().padStart(nameLimit,' ')}\u001B[0m`;
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
function stringifyIdentData(nameLimit, provider, data) {
	// writeRepeats(0, true);
	// writeDate(data.time);
	return ` ${stringifyName(nameLimit, provider.nameLimit,data.name)} \u001B[35m${stringifyIdent(nameLimit, data.identationLength-1,'>')}\u001B[1m ${data.identName}\u001B[0m\n`;
}
function stringifyDeentData(nameLimit, provider, data) {
	// writeRepeats(0, true);
	// writeDate(data.time);
	return ` ${stringifyName(nameLimit, provider.nameLimit,data.name)} \u001B[35m${stringifyIdent(nameLimit, data.identationLength,'<')}\u001B[1m ${data.identName}\u001B[22m (Done in ${data.identTime}ms)\u001B[0m\n`;
}
function stringifyTimeStartData(nameLimit, provider, data) {
	// writeRepeats(0, true);
	// writeDate(data.time);
	return ` \u001B[35m${stringifyName(nameLimit, provider.nameLimit,data.name,'1m')}\u001B[33m${stringifyIdent(nameLimit, data.identationLength)} T Started ${data.timeName}\n`;
}
function stringifyTimeEndData(nameLimit, provider, data) {
	// writeRepeats(0, true);
	// writeDate(data.time);
	return ` \u001B[35m${stringifyName(nameLimit, provider.nameLimit,data.name,'1m')}\u001B[34m${stringifyIdent(nameLimit, data.identationLength)} T Finished ${data.timeName}\u001B[1m in ${data.timeTime}ms\u001B[0m\n`;
}
function stringifyData(nameLimit, data) {
	let uncolored = format(data.line, ...data.params || []);
	return uncolored.replace(/{(\/?)([^}]+)}/g, (...d) => {
		if (!ansiColors[d[2]])return d[0];
		return '\u001B[' + ansiColors[d[2]][d[1] === '/' ? 1 : 0] + 'm';
	});
}
const STRIPPED_DATE=(new Date()).toLocaleTimeString().replace(/./g, ' ');
function stringifyCommonData(nameLimit, escapeCode, provider, data) {
	// writeRepeats(data.repeats, false);
	// writeDate(data.time);
	const strings = data.string.split('\n');
	let ret = ` \u001B[40m${stringifyName(nameLimit, provider.nameLimit, data.name, escapeCode)}\u001B[0m${stringifyIdent(nameLimit, data.identationLength)}${strings.shift()}\n`;
	for(let string of strings){
		ret += ` \u001B[40m${stringifyName(nameLimit, provider.nameLimit, '|', escapeCode)}\u001B[0m${stringifyIdent(nameLimit, data.identationLength)}${string}\n`;
		//`${stringifyIdent(data.identationLength)}${stringifyName(provider.nameLimit,'|',escapeCode)} ${string}\n`;
	}
	return ret;
}
function writeLogData(nameLimit, provider, data) {
	writeStdout(stringifyCommonData(nameLimit, '34m',provider,data));
}
function writeErrorData(nameLimit, provider, data) {
	writeStdout(stringifyCommonData(nameLimit, '31m',provider,data));
}
function writeWarningData(nameLimit, provider, data) {
	writeStdout(stringifyCommonData(nameLimit, '33m',provider,data));
}
function writeDebugData(nameLimit, provider, data) {
	writeStdout(stringifyCommonData(nameLimit, '90m',provider,data));
}

interface IProgressItem {
	name: string,
	progress: number,
    time:number
}
const progresses:{[key:string]:IProgressItem}={};
function progressStart(nameLimit, provider,data){
	progresses[data.name]={
		name:data.name,
		progress:0,
		time:data.time
	};
}
function progressEnd(nameLimit, provider,data){
	delete progresses[data.name];
}
function progress(nameLimit, provider,data){
	if(!progresses[data.name])
		return;
    progresses[data.name].time=data.time;
    progresses[data.name].progress=data.progress;
}
function renderProgress(nameLimit){
	save();
	let i=0;
	for(let progress of Object.values(progresses)) {
        moveCursor(i);
        clearLine();
        let percent=Math.ceil(progress.progress);
        writeStdout(`\u001B[34m${progress.name.padStart(nameLimit)} ${(percent + '%').padStart(4, ' ')} ${'|'.repeat(Math.ceil(((process.stdout as any).columns - 1 - 3 - 1 - 1 - nameLimit) / 100 * percent))}`);
        // writeEscape('34m');
        // writeStdout((<IProgressItem>progress).name.padStart(18,' '));
        // writeStdout(' ');
        // writeDate(progress.time);
        // writeStdout(' ');
        // writeStdout((percent+'%').padStart(4,' '));
        // writeStdout(' ');
        // writeStdout('|'.repeat(Math.ceil(((<any>process.stdout).columns-1-3-1-8-1-18)/100*percent)));
        i++;
    }

	restore();
}

export default class NodeConsoleReceiver extends BasicReceiver {
	nameLimit:number;

	constructor(nameLimit = 18) {
		super();
		this.nameLimit = nameLimit;
	}

	write(data) {
		let {nameLimit} = this;
        if(Object.values(progresses).length!==0) {
            startBuffering();
        }
		data.string = stringifyData(nameLimit, data);
		// if (data.repeated) {
		// 	if(!process.env.NO_COLLAPSE){
		// 		save();
		// 		writeEscape(data.string.split('\n').length + 'A');
		// 		//data.repeats
		// 	}
		// }
		switch (data.type) {
			case LOGGER_ACTIONS.IDENT:
				writeStdout(stringifyIdentData(nameLimit, this, data));
				break;
			case LOGGER_ACTIONS.DEENT:
				writeStdout(stringifyDeentData(nameLimit, this, data));
				break;
			case LOGGER_ACTIONS.LOG:
				writeLogData(nameLimit, this, data);
				break;
			case LOGGER_ACTIONS.ERROR:
				writeErrorData(nameLimit, this, data);
				break;
			case LOGGER_ACTIONS.WARNING:
				writeWarningData(nameLimit, this, data);
				break;
			case LOGGER_ACTIONS.DEBUG:
				writeDebugData(nameLimit, this, data);
				break;
			case LOGGER_ACTIONS.TIME_START:
				writeStdout(stringifyTimeStartData(nameLimit, this, data));
				break;
			case LOGGER_ACTIONS.TIME_END:
				writeStdout(stringifyTimeEndData(nameLimit, this, data));
				break;
			case LOGGER_ACTIONS.PROGRESS_START:
				progressStart(nameLimit, this, data);
				break;
			case LOGGER_ACTIONS.PROGRESS_END:
				progressEnd(nameLimit, this,data);
				break;
			case LOGGER_ACTIONS.PROGRESS:
				progress(nameLimit, this,data);
				break;
			default:
				console._log(data);
		}
		// if (data.repeated) {
		// 	if(!process.env.NO_COLLAPSE)restore();
		// }
        // TODO: Support for non-tty terminals
        if(Object.values(progresses).length!==0) {
            renderProgress(nameLimit);
            flushBuffer();
        }
	}
}

let terminalLogger=new Logger('terminal');

process.on('uncaughtException', e => {
	terminalLogger.err('UncaughtException:');
	terminalLogger.err(e.stack);
	process.exit(0);
});

process.on('unhandledRejection', e => {
	terminalLogger.err('UnhandledRejection:');
	terminalLogger.err(e.stack);
	process.exit(0);
});

// process.on('warning', e => {
// 	terminalLogger.warn(e.stack);
// });