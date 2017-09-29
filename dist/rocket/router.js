"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
const inferno_router_1 = require("inferno-router");
const createBrowserHistory_1 = require("history/createBrowserHistory");
const createMemoryHistory_1 = require("history/createMemoryHistory");
const RouterStore_1 = require("./RouterStore");
const mobx_1 = require("./mobx");
function createRenderer(isClient = false, storesCreator, RootComponent) {
    let stores = storesCreator();
    if (!(stores.router instanceof RouterStore_1.RouterStore))
        throw new Error('stores.router must be instance of RouterStore');
    let linkHistory = isClient ? createBrowserHistory_1.default() : createMemoryHistory_1.default();
    const history = RouterStore_1.syncHistoryWithStore(linkHistory, stores.router);
    const root = React.createElement(mobx_1.Provider, __assign({}, stores),
        React.createElement(inferno_router_1.Router, { history: history },
            React.createElement(RootComponent, null)));
}
//# sourceMappingURL=router.js.map