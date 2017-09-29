"use strict";
const util_1 = require("util");
const _1 = require("../");
const terminal_1 = require("@meteor-it/terminal");
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
if (!process.env.NODE_CONSOLE_DONT_CLEAR)
    terminal_1.clearScreen();
function stringifyIdent(nameLimit, count, symbolNeeded = undefined) {
    return `${'  '.repeat(count)}${symbolNeeded ? symbolNeeded : ' '}`;
}
function stringifyName(nameLimit, limit, name, escapeCode = '44m') {
    return `\u001B[${escapeCode}\u001B[1m${nameLimit === 0 ? '' : name.toString().padStart(nameLimit, ' ')}\u001B[0m`;
}
function stringifyIdentData(nameLimit, provider, data) {
    return ` ${stringifyName(nameLimit, provider.nameLimit, data.name)} \u001B[35m${stringifyIdent(nameLimit, data.identationLength - 1, '>')}\u001B[1m ${data.identName}\u001B[0m\n`;
}
function stringifyDeentData(nameLimit, provider, data) {
    return ` ${stringifyName(nameLimit, provider.nameLimit, data.name)} \u001B[35m${stringifyIdent(nameLimit, data.identationLength, '<')}\u001B[1m ${data.identName}\u001B[22m (Done in ${data.identTime}ms)\u001B[0m\n`;
}
function stringifyTimeStartData(nameLimit, provider, data) {
    return ` \u001B[35m${stringifyName(nameLimit, provider.nameLimit, data.name, '1m')}\u001B[33m${stringifyIdent(nameLimit, data.identationLength)} T Started ${data.timeName}\n`;
}
function stringifyTimeEndData(nameLimit, provider, data) {
    return ` \u001B[35m${stringifyName(nameLimit, provider.nameLimit, data.name, '1m')}\u001B[34m${stringifyIdent(nameLimit, data.identationLength)} T Finished ${data.timeName}\u001B[1m in ${data.timeTime}ms\u001B[0m\n`;
}
function stringifyData(nameLimit, data) {
    let uncolored = util_1.format(data.line, ...data.params || []);
    return uncolored.replace(/{(\/?)([^}]+)}/g, (...d) => {
        if (!ansiColors[d[2]])
            return d[0];
        return '\u001B[' + ansiColors[d[2]][d[1] === '/' ? 1 : 0] + 'm';
    });
}
const STRIPPED_DATE = (new Date()).toLocaleTimeString().replace(/./g, ' ');
function stringifyCommonData(nameLimit, escapeCode, provider, data) {
    const strings = data.string.split('\n');
    let ret = ` \u001B[40m${stringifyName(nameLimit, provider.nameLimit, data.name, escapeCode)}\u001B[0m${stringifyIdent(nameLimit, data.identationLength)}${strings.shift()}\n`;
    for (let string of strings) {
        ret += ` \u001B[40m${stringifyName(nameLimit, provider.nameLimit, '|', escapeCode)}\u001B[0m${stringifyIdent(nameLimit, data.identationLength)}${string}\n`;
    }
    return ret;
}
function writeLogData(nameLimit, provider, data) {
    terminal_1.writeStdout(stringifyCommonData(nameLimit, '34m', provider, data));
}
function writeErrorData(nameLimit, provider, data) {
    terminal_1.writeStdout(stringifyCommonData(nameLimit, '31m', provider, data));
}
function writeWarningData(nameLimit, provider, data) {
    terminal_1.writeStdout(stringifyCommonData(nameLimit, '33m', provider, data));
}
function writeDebugData(nameLimit, provider, data) {
    terminal_1.writeStdout(stringifyCommonData(nameLimit, '90m', provider, data));
}
const progresses = {};
function progressStart(nameLimit, provider, data) {
    progresses[data.name] = {
        name: data.name,
        progress: 0,
        time: data.time
    };
}
function progressEnd(nameLimit, provider, data) {
    delete progresses[data.name];
}
function progress(nameLimit, provider, data) {
    if (!progresses[data.name])
        return;
    progresses[data.name].time = data.time;
    progresses[data.name].progress = data.progress;
}
function renderProgress(nameLimit) {
    terminal_1.save();
    let i = 0;
    for (let progress of Object.values(progresses)) {
        terminal_1.moveCursor(i);
        terminal_1.clearLine();
        let percent = Math.ceil(progress.progress);
        terminal_1.writeStdout(`\u001B[34m${progress.name.padStart(nameLimit)} ${(percent + '%').padStart(4, ' ')} ${'|'.repeat(Math.ceil((process.stdout.columns - 1 - 3 - 1 - 1 - nameLimit) / 100 * percent))}`);
        i++;
    }
    terminal_1.restore();
}
class NodeConsoleReceiver extends _1.BasicReceiver {
    constructor(nameLimit = 18) {
        super();
        this.nameLimit = nameLimit;
    }
    write(data) {
        let { nameLimit } = this;
        if (Object.values(progresses).length !== 0) {
            terminal_1.startBuffering();
        }
        data.string = stringifyData(nameLimit, data);
        switch (data.type) {
            case _1.LOGGER_ACTIONS.IDENT:
                terminal_1.writeStdout(stringifyIdentData(nameLimit, this, data));
                break;
            case _1.LOGGER_ACTIONS.DEENT:
                terminal_1.writeStdout(stringifyDeentData(nameLimit, this, data));
                break;
            case _1.LOGGER_ACTIONS.LOG:
                writeLogData(nameLimit, this, data);
                break;
            case _1.LOGGER_ACTIONS.ERROR:
                writeErrorData(nameLimit, this, data);
                break;
            case _1.LOGGER_ACTIONS.WARNING:
                writeWarningData(nameLimit, this, data);
                break;
            case _1.LOGGER_ACTIONS.DEBUG:
                writeDebugData(nameLimit, this, data);
                break;
            case _1.LOGGER_ACTIONS.TIME_START:
                terminal_1.writeStdout(stringifyTimeStartData(nameLimit, this, data));
                break;
            case _1.LOGGER_ACTIONS.TIME_END:
                terminal_1.writeStdout(stringifyTimeEndData(nameLimit, this, data));
                break;
            case _1.LOGGER_ACTIONS.PROGRESS_START:
                progressStart(nameLimit, this, data);
                break;
            case _1.LOGGER_ACTIONS.PROGRESS_END:
                progressEnd(nameLimit, this, data);
                break;
            case _1.LOGGER_ACTIONS.PROGRESS:
                progress(nameLimit, this, data);
                break;
            default:
                console._log(data);
        }
        if (Object.values(progresses).length !== 0) {
            renderProgress(nameLimit);
            terminal_1.flushBuffer();
        }
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NodeConsoleReceiver;
let terminalLogger = new _1.default('terminal');
process.on('uncaughtException', e => {
    terminalLogger.err(e.stack);
});
process.on('unhandledRejection', e => {
    terminalLogger.err(e.stack);
});
//# sourceMappingURL=node.js.map