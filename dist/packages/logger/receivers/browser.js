"use strict";
const _1 = require("../");
const utils_1 = require("@meteor-it/utils");
const colors = {
    reset: ['', ''],
    bold: ['text-decoration:bold', 'text-decoration:none'],
    dim: ['text-decoration:bold', 'text-decoration:none'],
    italic: ['text-decoration:italic', 'text-decoration:none'],
    underline: ['text-decoration:underline', 'text-decoration:none'],
    inverse: ['color:black', 'text-decoration:none'],
    hidden: ['visible:none', 'text-decoration:none'],
    strikethrough: ['text-decoration:line-through', 'text-decoration:none'],
    black: ['color:black', 'color:black'],
    red: ['color:red', 'color:black'],
    green: ['color:green', 'color:black'],
    yellow: ['color:yellow', 'color:black'],
    blue: ['color:blue', 'color:black'],
    magenta: ['color:magenta', 'color:black'],
    cyan: ['color:cyan', 'color:black'],
    white: ['color:white', 'color:black'],
    gray: ['color:gray', 'color:black'],
    bgBlack: ['background:black', 'background:white'],
    bgRed: ['background:red', 'background:white'],
    bgGreen: ['background:green', 'background:white'],
    bgYellow: ['background:yellow', 'background:white'],
    bgBlue: ['background:blue', 'background:white'],
    bgMagenta: ['background:magenta', 'background:white'],
    bgCyan: ['background:cyan', 'background:white'],
    bgWhite: ['background:white', 'background:white']
};
function extractColors(line) {
    let r = [];
    let nl = line.replace(/{(\/?)([^}]+)}/g, (...d) => {
        if (!colors[d[2]])
            return d[0];
        r.push(colors[d[2]][d[1] === '/' ? 1 : 0]);
        return '%c';
    });
    return [r, nl];
}
class BrowserConsoleReceiver extends _1.BasicReceiver {
    constructor(nameLimit = 8) {
        super();
        this.nameLimit = nameLimit;
    }
    write(data) {
        let line = [data.line, ...data.params];
        let name = utils_1.fixLength(data.name, this.nameLimit, true, ' ');
        switch (data.type) {
            case _1.LOGGER_ACTIONS.IDENT:
                console.group('%cIDENT', data.name);
                break;
            case _1.LOGGER_ACTIONS.DEENT:
                console.groupEnd();
                break;
            case _1.LOGGER_ACTIONS.LOG:
                console._log(...line);
                break;
            case _1.LOGGER_ACTIONS.ERROR:
                console._error(...line);
                break;
            case _1.LOGGER_ACTIONS.WARNING:
                console._error(...line);
                break;
            case _1.LOGGER_ACTIONS.DEBUG:
                console._log(...line);
                break;
            case _1.LOGGER_ACTIONS.TIME_START:
                console._log('TIME_START');
                break;
            case _1.LOGGER_ACTIONS.TIME_END:
                console._log('TIME_END');
                break;
            default:
                console._error('ERROR', data.type, _1.LOGGER_ACTIONS);
        }
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BrowserConsoleReceiver;
//# sourceMappingURL=browser.js.map