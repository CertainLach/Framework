"use strict";
const mobx_1 = require("mobx");
exports.observable = mobx_1.observable;
exports.observe = mobx_1.observe;
exports.unboundAction = mobx_1.action;
exports.autorun = mobx_1.autorun;
exports.toJS = mobx_1.toJS;
exports.computed = mobx_1.computed;
const inferno_mobx_1 = require("inferno-mobx");
exports.connect = inferno_mobx_1.connect;
exports.observer = inferno_mobx_1.observer;
exports.Provider = inferno_mobx_1.Provider;
exports.inject = inferno_mobx_1.inject;
const action = mobx_1.action.bound;
exports.action = action;
//# sourceMappingURL=mobx.js.map