"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const logger_1 = require("@meteor-it/logger");
const queueLogger = new logger_1.default('queue');
function queue(time = 0, maxCalls = 1, collapser = null) {
    return function queueDecorator(target, key, descriptor) {
        let queued = [];
        let origFun = descriptor.value;
        let busy = false;
        let startTime;
        function process() {
            return __awaiter(this, void 0, void 0, function* () {
                busy = true;
                if (queued.length === 0) {
                    busy = false;
                    return;
                }
                startTime = Date.now();
                if (collapser !== null) {
                    if (maxCalls === 1)
                        queueLogger.warn('Collapser is for multiple running tasks in time, but you specified only 1.');
                    let willBeExecuted = queued.slice(0, maxCalls);
                    queued = queued.slice(maxCalls);
                    let multiExecuted = willBeExecuted.map(task => task.args);
                    try {
                        let returns = yield (target[collapser].call(willBeExecuted[0].context, multiExecuted));
                        if (!returns)
                            throw new Error('Collapser doesn\'t returned anything!');
                        if (!(returns instanceof Array))
                            throw new Error('Collapser return value isn\'t array!');
                        if (returns.length !== willBeExecuted.length)
                            throw new Error('Collapser returned wrong data array! (Length mismatch)');
                        willBeExecuted.map((task, id) => {
                            if (returns[id] instanceof Error)
                                task.reject(returns[id]);
                            else
                                task.resolve(returns[id]);
                        });
                    }
                    catch (e) {
                        willBeExecuted.forEach(task => task.reject(e));
                    }
                }
                else {
                    if (maxCalls !== 1)
                        throw new Error('Only 1 call can be processed at time if no collapser is defined!');
                    let task = queued.shift();
                    try {
                        let data = yield origFun.call(task.context, ...task.args);
                        if (data instanceof Error)
                            task.reject(data);
                        else
                            task.resolve(data);
                    }
                    catch (e) {
                        task.reject(e);
                    }
                }
                if (queued.length > 0) {
                    let nowTime = Date.now();
                    let timeLeftToSleep = startTime + time - nowTime;
                    if (timeLeftToSleep <= 1) {
                        setTimeout(() => process(), 1);
                    }
                    else {
                        setTimeout(() => process(), timeLeftToSleep);
                    }
                }
                else {
                    busy = false;
                }
            });
        }
        ;
        descriptor.value = function () {
            let context = this;
            let args = arguments;
            return new Promise((resolve, reject) => {
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
//# sourceMappingURL=index.js.map