import './colors';
var DEBUG = process.env.DEBUG || '';
export var LOGGER_ACTIONS;
(function (LOGGER_ACTIONS) {
    LOGGER_ACTIONS[LOGGER_ACTIONS["IDENT"] = 0] = "IDENT";
    LOGGER_ACTIONS[LOGGER_ACTIONS["DEENT"] = 1] = "DEENT";
    LOGGER_ACTIONS[LOGGER_ACTIONS["LOG"] = 2] = "LOG";
    LOGGER_ACTIONS[LOGGER_ACTIONS["WARNING"] = 3] = "WARNING";
    LOGGER_ACTIONS[LOGGER_ACTIONS["DEPRECATED"] = 4] = "DEPRECATED";
    LOGGER_ACTIONS[LOGGER_ACTIONS["ERROR"] = 5] = "ERROR";
    LOGGER_ACTIONS[LOGGER_ACTIONS["DEBUG"] = 6] = "DEBUG";
    LOGGER_ACTIONS[LOGGER_ACTIONS["TIME_START"] = 7] = "TIME_START";
    LOGGER_ACTIONS[LOGGER_ACTIONS["TIME_END"] = 8] = "TIME_END";
    LOGGER_ACTIONS[LOGGER_ACTIONS["PROGRESS"] = 9] = "PROGRESS";
    LOGGER_ACTIONS[LOGGER_ACTIONS["PROGRESS_START"] = 10] = "PROGRESS_START";
    LOGGER_ACTIONS[LOGGER_ACTIONS["PROGRESS_END"] = 11] = "PROGRESS_END";
    LOGGER_ACTIONS[LOGGER_ACTIONS["INFO"] = 2] = "INFO";
    LOGGER_ACTIONS[LOGGER_ACTIONS["WARN"] = 3] = "WARN";
    LOGGER_ACTIONS[LOGGER_ACTIONS["ERR"] = 5] = "ERR";
})(LOGGER_ACTIONS || (LOGGER_ACTIONS = {}));
var REPEATABLE_ACTIONS = [
    LOGGER_ACTIONS.IDENT,
    LOGGER_ACTIONS.DEENT,
    LOGGER_ACTIONS.TIME_START,
    LOGGER_ACTIONS.TIME_END,
    LOGGER_ACTIONS.PROGRESS,
    LOGGER_ACTIONS.PROGRESS_START,
    LOGGER_ACTIONS.PROGRESS_END
];
var consoleLogger;
var loggerLogger;
var BasicReceiver = /** @class */ (function () {
    function BasicReceiver() {
    }
    BasicReceiver.prototype.setLogger = function (logger) {
        this.logger = logger;
    };
    BasicReceiver.prototype.write = function (data) {
        throw new Error('write(): Not implemented!');
    };
    return BasicReceiver;
}());
export { BasicReceiver };
/**
 * Powerfull logger. Exists from second generation of "ayzek"
 */
var Logger = /** @class */ (function () {
    function Logger(name) {
        this.identation = [];
        this.identationTime = [];
        this.times = {};
        this.name = name.toUpperCase();
    }
    Logger.setNameLength = function (length) {
        Logger.nameLength = length;
    };
    Logger.prototype.timeStart = function (name) {
        if (this.times[name]) {
            loggerLogger.warn('timeStart(%s) called 2 times with same name!', name);
            return;
        }
        this.times[name] = new Date().getTime();
        this.write({
            type: LOGGER_ACTIONS.TIME_START,
            timeName: name
        });
    };
    Logger.prototype.timeEnd = function (name) {
        if (!this.times[name]) {
            loggerLogger.warn('timeEnd(%s) called with unknown name!', name);
            return;
        }
        this.write({
            type: LOGGER_ACTIONS.TIME_END,
            timeName: name,
            timeTime: new Date().getTime() - this.times[name]
        });
        delete this.times[name];
    };
    Logger.prototype.ident = function (name) {
        this.identation.push(name);
        this.identationTime.push(new Date().getTime());
        this.write({
            type: LOGGER_ACTIONS.IDENT,
            identName: name
        });
    };
    Logger.prototype.deent = function () {
        if (this.identation.length === 0) {
            return;
        }
        this.write({
            type: LOGGER_ACTIONS.DEENT,
            identName: this.identation.pop(),
            identTime: new Date().getTime() - this.identationTime.pop()
        });
    };
    Logger.prototype.deentAll = function () {
        while (this.identation.length > 0) {
            this.deent();
        }
    };
    // LOG
    Logger.prototype.log = function () {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i] = arguments[_i];
        }
        this.write({
            type: LOGGER_ACTIONS.LOG,
            line: params.shift(),
            params: params
        });
    };
    Logger.prototype.info = function () {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i] = arguments[_i];
        }
        this.write({
            type: LOGGER_ACTIONS.LOG,
            line: params.shift(),
            params: params
        });
    };
    // WARNING
    Logger.prototype.warning = function () {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i] = arguments[_i];
        }
        this.write({
            type: LOGGER_ACTIONS.WARNING,
            line: params.shift(),
            params: params
        });
    };
    Logger.prototype.warn = function () {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i] = arguments[_i];
        }
        this.write({
            type: LOGGER_ACTIONS.WARNING,
            line: params.shift(),
            params: params
        });
    };
    Logger.prototype.error = function () {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i] = arguments[_i];
        }
        this.write({
            type: LOGGER_ACTIONS.ERROR,
            line: params.shift(),
            params: params
        });
    };
    Logger.prototype.err = function () {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i] = arguments[_i];
        }
        this.write({
            type: LOGGER_ACTIONS.ERROR,
            line: params.shift(),
            params: params
        });
    };
    // DEBUG
    Logger.prototype.debug = function () {
        var params = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            params[_i] = arguments[_i];
        }
        //if(DEBUG === '-')
        //	return;
        if (DEBUG === '*' || ~DEBUG.split(',').indexOf(this.name))
            this.write({
                type: LOGGER_ACTIONS.DEBUG,
                line: params.shift(),
                params: params
            });
    };
    // Progress
    Logger.prototype.progress = function (name, progress, info) {
        if (progress === true) {
            this.write({
                type: LOGGER_ACTIONS.PROGRESS_START,
                name: name
            });
        }
        else if (progress === false) {
            this.write({
                type: LOGGER_ACTIONS.PROGRESS_END,
                name: name
            });
        }
        else {
            this.write({
                type: LOGGER_ACTIONS.PROGRESS,
                name: name,
                progress: progress,
                info: info
            });
        }
    };
    Logger.prototype.write = function (data) {
        if (!data.time)
            data.time = new Date().getTime();
        if (!data.name)
            data.name = this.name;
        if (!data.identationLength)
            data.identationLength = this.identation.length;
        Logger._write(data);
    };
    Logger._write = function (what) {
        if (Logger.receivers.length === 0) {
            if (!Logger.noReceiversWarned) {
                console._log('No receivers are defined for logger! See docs for info about this!');
                Logger.noReceiversWarned = true;
            }
            switch (what.type) {
                case LOGGER_ACTIONS.DEBUG:
                case LOGGER_ACTIONS.LOG:
                    console._log.apply(console, [what.line].concat(what.params));
                    break;
                case LOGGER_ACTIONS.ERROR:
                    console._error.apply(console, [what.line].concat(what.params));
                    break;
                case LOGGER_ACTIONS.WARNING:
                    console._warn.apply(console, [what.line].concat(what.params));
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
        Logger.receivers.forEach(function (receiver) { return receiver.write(what); });
    };
    Logger.resetRepeating = function (provider, message, type) {
        Logger.lastProvider = provider;
        Logger.lastMessage = message;
        Logger.lastType = type;
        Logger.repeatCount = 0;
    };
    Logger.isRepeating = function (provider, message, type) {
        return Logger.lastProvider === provider && Logger.lastMessage === message && Logger.lastType === type;
    };
    Logger.addReceiver = function (receiver) {
        if (Logger.receivers.length === 4)
            loggerLogger.warn('Possible memory leak detected: 4 or more receivers are added.');
        receiver.setLogger(Logger);
        Logger.receivers.push(receiver);
    };
    Logger.nameLength = 12;
    Logger.receivers = [];
    Logger.noReceiversWarned = false;
    return Logger;
}());
export default Logger;
consoleLogger = new Logger('console');
loggerLogger = new Logger('logger'); // Like in java :D
if (!console._patchedByLogger) {
    var _loop_1 = function (method) {
        console['_' + method] = console[method];
        console[method] = function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return consoleLogger[method].apply(consoleLogger, args);
        };
    };
    for (var _i = 0, _a = ['log', 'error', 'warn', 'err', 'warning']; _i < _a.length; _i++) {
        var method = _a[_i];
        _loop_1(method);
    }
    console._patchedByLogger = true;
}
//# sourceMappingURL=index.js.map