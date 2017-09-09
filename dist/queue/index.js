var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
(function (dependencies, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    }
})(["require", "exports", "@meteor-it/logger"], function (require, exports) {
    "use strict";
    var logger_1 = require("@meteor-it/logger");
    var queueLogger = new logger_1.default('queue');
    function queue(time, maxCalls, collapser) {
        if (time === void 0) { time = 0; }
        if (maxCalls === void 0) { maxCalls = 1; }
        if (collapser === void 0) { collapser = null; }
        return function queueDecorator(target, key, descriptor) {
            var queued = [];
            var origFun = descriptor.value;
            var busy = false;
            var startTime;
            function process() {
                return __awaiter(this, void 0, void 0, function () {
                    var willBeExecuted, multiExecuted, returns_1, e_1, task, data, e_2, nowTime, timeLeftToSleep;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                busy = true;
                                if (queued.length === 0) {
                                    busy = false;
                                    return [2 /*return*/];
                                }
                                startTime = Date.now();
                                if (!(collapser !== null))
                                    return [3 /*break*/, 5];
                                // Collapsed task
                                if (maxCalls === 1)
                                    queueLogger.warn('Collapser is for multiple running tasks in time, but you specified only 1.');
                                willBeExecuted = queued.slice(0, maxCalls);
                                queued = queued.slice(maxCalls);
                                multiExecuted = willBeExecuted.map(function (task) { return task.args; });
                                _a.label = 1;
                            case 1:
                                _a.trys.push([1, 3, , 4]);
                                return [4 /*yield*/, (target[collapser].call(willBeExecuted[0].context, multiExecuted))];
                            case 2:
                                returns_1 = _a.sent();
                                if (!returns_1)
                                    throw new Error('Collapser doesn\'t returned anything!');
                                if (!(returns_1 instanceof Array))
                                    throw new Error('Collapser return value isn\'t array!');
                                if (returns_1.length !== willBeExecuted.length)
                                    throw new Error('Collapser returned wrong data array! (Length mismatch)');
                                willBeExecuted.map(function (task, id) {
                                    if (returns_1[id] instanceof Error)
                                        task.reject(returns_1[id]);
                                    else
                                        task.resolve(returns_1[id]);
                                });
                                return [3 /*break*/, 4];
                            case 3:
                                e_1 = _a.sent();
                                willBeExecuted.forEach(function (task) { return task.reject(e_1); });
                                return [3 /*break*/, 4];
                            case 4: return [3 /*break*/, 9];
                            case 5:
                                // Single task
                                if (maxCalls !== 1)
                                    throw new Error('Only 1 call can be processed at time if no collapser is defined!');
                                task = queued.shift();
                                _a.label = 6;
                            case 6:
                                _a.trys.push([6, 8, , 9]);
                                return [4 /*yield*/, origFun.call.apply(origFun, [task.context].concat(task.args))];
                            case 7:
                                data = _a.sent();
                                if (data instanceof Error)
                                    task.reject(data);
                                else
                                    task.resolve(data);
                                return [3 /*break*/, 9];
                            case 8:
                                e_2 = _a.sent();
                                task.reject(e_2);
                                return [3 /*break*/, 9];
                            case 9:
                                if (queued.length > 0) {
                                    nowTime = Date.now();
                                    timeLeftToSleep = startTime + time - nowTime;
                                    if (timeLeftToSleep <= 1) {
                                        setTimeout(function () { return process(); }, 1);
                                    }
                                    else {
                                        setTimeout(function () { return process(); }, timeLeftToSleep);
                                    }
                                }
                                else {
                                    busy = false;
                                }
                                return [2 /*return*/];
                        }
                    });
                });
            }
            ;
            descriptor.value = function () {
                var context = this;
                var args = arguments;
                return new Promise(function (resolve, reject) {
                    queued.push({
                        reject: reject,
                        resolve: resolve,
                        args: args,
                        context: context
                    });
                    if (!busy)
                        process();
                });
            };
            return descriptor;
        };
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = queue;
});
//# sourceMappingURL=index.js.map