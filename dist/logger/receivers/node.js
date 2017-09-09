var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
(function (dependencies, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    }
})(["require", "exports", "util", "../", "@meteor-it/terminal", "@meteor-it/emoji"], function (require, exports) {
    "use strict";
    var util_1 = require("util");
    var _1 = require("../");
    var terminal_1 = require("@meteor-it/terminal");
    var emoji_1 = require("@meteor-it/emoji");
    var ansiColors = {
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
    function stringifyIdent(count, symbolNeeded) {
        if (symbolNeeded === void 0) { symbolNeeded = undefined; }
        return '  '.repeat(symbolNeeded ? count - 1 : count) + " " + (symbolNeeded ? symbolNeeded : '');
    }
    // function writeDate(date) {
    // 	// writeEscape('36m');
    // 	// writeStdout((new Date(date)).toLocaleTimeString());
    // 	// writeEscape('0m');
    // }
    function stringifyName(limit, name, escapeCode) {
        if (escapeCode === void 0) { escapeCode = '44m'; }
        return "\u001B[" + escapeCode + "\u001B[1m" + name.toString().padStart(16, ' ') + "\u001B[0m";
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
        return " " + stringifyName(provider.nameLimit, data.name) + " \u001B[35m" + stringifyIdent(data.identationLength, '>') + "\u001B[1m " + data.identName + "\u001B[0m\n";
    }
    function stringifyDeentData(provider, data) {
        // writeRepeats(0, true);
        // writeDate(data.time);
        return " " + stringifyName(provider.nameLimit, data.name) + " \u001B[35m" + stringifyIdent(data.identationLength + 1, '<') + "\u001B[1m " + data.identName + "\u001B[22m (Done in " + data.identTime + "ms)\u001B[0m\n";
    }
    function stringifyTimeStartData(provider, data) {
        // writeRepeats(0, true);
        // writeDate(data.time);
        return " \u001B[35m" + stringifyName(provider.nameLimit, data.name, '1m') + "\u001B[33m" + stringifyIdent(data.identationLength) + emoji_1.default['clock face one oclock'] + " Started " + data.timeName + "\n";
    }
    function stringifyTimeEndData(provider, data) {
        // writeRepeats(0, true);
        // writeDate(data.time);
        return " \u001B[35m" + stringifyName(provider.nameLimit, data.name, '1m') + "\u001B[34m" + stringifyIdent(data.identationLength) + emoji_1.default['clock face six oclock'] + " Finished " + data.timeName + "\u001B[1m in " + data.timeTime + "ms\u001B[0m\n";
    }
    function stringifyData(data) {
        var uncolored = util_1.format.apply(void 0, [data.line].concat(data.params || [])).emojify();
        return uncolored.replace(/{(\/?)([^}]+)}/g, function () {
            var d = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                d[_i] = arguments[_i];
            }
            if (!ansiColors[d[2]])
                return d[0];
            return '\u001B[' + ansiColors[d[2]][d[1] === '/' ? 1 : 0] + 'm';
        });
    }
    var STRIPPED_DATE = (new Date()).toLocaleTimeString().replace(/./g, ' ');
    function stringifyCommonData(escapeCode, provider, data) {
        // writeRepeats(data.repeats, false);
        // writeDate(data.time);
        var strings = data.string.split('\n');
        var ret = " \u001B[40m" + stringifyName(provider.nameLimit, data.name, escapeCode) + "\u001B[0m" + stringifyIdent(data.identationLength) + strings.shift() + "\n";
        for (var _i = 0, strings_1 = strings; _i < strings_1.length; _i++) {
            var string = strings_1[_i];
            ret += "" + stringifyIdent(data.identationLength) + stringifyName(provider.nameLimit, '|', escapeCode) + " " + string + "\n";
        }
        return ret;
    }
    function writeLogData(provider, data) {
        terminal_1.writeStdout(stringifyCommonData('34m', provider, data));
    }
    function writeErrorData(provider, data) {
        terminal_1.writeStdout(stringifyCommonData('31m', provider, data));
    }
    function writeWarningData(provider, data) {
        terminal_1.writeStdout(stringifyCommonData('33m', provider, data));
    }
    function writeDebugData(provider, data) {
        terminal_1.writeStdout(stringifyCommonData('90m', provider, data));
    }
    var progresses = {};
    function progressStart(provider, data) {
        progresses[data.name] = {
            name: data.name,
            progress: 0,
            time: data.time
        };
    }
    function progressEnd(provider, data) {
        delete progresses[data.name];
    }
    function progress(provider, data) {
        if (!progresses[data.name])
            return;
        progresses[data.name].time = data.time;
        progresses[data.name].progress = data.progress;
    }
    function renderProgress() {
        terminal_1.save();
        var i = 0;
        for (var _i = 0, _a = Object.values(progresses); _i < _a.length; _i++) {
            var progress_1 = _a[_i];
            terminal_1.moveCursor(i);
            terminal_1.clearLine();
            var percent = Math.ceil(progress_1.progress);
            // TODO: Unhardcode "18"
            terminal_1.writeStdout("\u001B[34m" + progress_1.name.padStart(18) + " " + (percent + '%').padStart(4, ' ') + " " + '|'.repeat(Math.ceil((process.stdout.columns - 1 - 3 - 1 - 1 - 18) / 100 * percent)));
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
        terminal_1.restore();
    }
    var NodeConsoleReceiver = (function (_super) {
        __extends(NodeConsoleReceiver, _super);
        function NodeConsoleReceiver(nameLimit) {
            if (nameLimit === void 0) { nameLimit = 18; }
            var _this = _super.call(this) || this;
            _this.nameLimit = nameLimit;
            return _this;
        }
        NodeConsoleReceiver.prototype.write = function (data) {
            terminal_1.startBuffering();
            data.string = stringifyData(data);
            // if (data.repeated) {
            // 	if(!process.env.NO_COLLAPSE){
            // 		save();
            // 		writeEscape(data.string.split('\n').length + 'A');
            // 		//data.repeats
            // 	}
            // }
            switch (data.type) {
                case _1.LOGGER_ACTIONS.IDENT:
                    terminal_1.writeStdout(stringifyIdentData(this, data));
                    break;
                case _1.LOGGER_ACTIONS.DEENT:
                    terminal_1.writeStdout(stringifyDeentData(this, data));
                    break;
                case _1.LOGGER_ACTIONS.LOG:
                    writeLogData(this, data);
                    break;
                case _1.LOGGER_ACTIONS.ERROR:
                    writeErrorData(this, data);
                    break;
                case _1.LOGGER_ACTIONS.WARNING:
                    writeWarningData(this, data);
                    break;
                case _1.LOGGER_ACTIONS.DEBUG:
                    writeDebugData(this, data);
                    break;
                case _1.LOGGER_ACTIONS.TIME_START:
                    terminal_1.writeStdout(stringifyTimeStartData(this, data));
                    break;
                case _1.LOGGER_ACTIONS.TIME_END:
                    terminal_1.writeStdout(stringifyTimeEndData(this, data));
                    break;
                case _1.LOGGER_ACTIONS.PROGRESS_START:
                    progressStart(this, data);
                    break;
                case _1.LOGGER_ACTIONS.PROGRESS_END:
                    progressEnd(this, data);
                    break;
                case _1.LOGGER_ACTIONS.PROGRESS:
                    progress(this, data);
                    break;
                default:
                    console._log(data);
            }
            // if (data.repeated) {
            // 	if(!process.env.NO_COLLAPSE)restore();
            // }
            // TODO: Support for non-tty terminals
            renderProgress();
            terminal_1.flushBuffer();
        };
        return NodeConsoleReceiver;
    }(_1.BasicReceiver));
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = NodeConsoleReceiver;
    var terminalLogger = new _1.default('terminal');
    process.on('uncaughtException', function (e) {
        terminalLogger.err(e.stack);
    });
    process.on('unhandledRejection', function (e) {
        terminalLogger.err(e.stack);
    });
});
// process.on('warning', e => {
// 	terminalLogger.warn(e.stack);
// }); 
//# sourceMappingURL=node.js.map