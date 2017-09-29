"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
const mobx_1 = require("./mobx");
const reactTools_1 = require("./reactTools");
class RouterStore {
    constructor() {
        this.location = null;
        this.history = null;
    }
    _updateLocation(newState) {
        this.location = newState;
    }
    push(location) {
        this.history.push(location);
    }
    replace(location) {
        this.history.replace(location);
    }
    go(n) {
        this.history.go(n);
    }
    goBack() {
        this.history.goBack();
    }
    goForward() {
        this.history.goForward();
    }
}
__decorate([
    mobx_1.observable,
    __metadata("design:type", Object)
], RouterStore.prototype, "location", void 0);
__decorate([
    mobx_1.unboundAction,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RouterStore.prototype, "_updateLocation", null);
__decorate([
    reactTools_1.autobind,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RouterStore.prototype, "push", null);
__decorate([
    reactTools_1.autobind,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RouterStore.prototype, "replace", null);
__decorate([
    reactTools_1.autobind,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RouterStore.prototype, "go", null);
__decorate([
    reactTools_1.autobind,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RouterStore.prototype, "goBack", null);
__decorate([
    reactTools_1.autobind,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RouterStore.prototype, "goForward", null);
exports.RouterStore = RouterStore;
exports.syncHistoryWithStore = (history, store) => {
    store.history = history;
    const handleLocationChange = (location) => {
        store._updateLocation(location);
    };
    const unsubscribeFromHistory = history.listen(handleLocationChange);
    handleLocationChange(history.getCurrentLocation());
    return __assign({}, history, { listen(listener) {
            const onStoreChange = (change) => {
                listener(store.location);
            };
            const unsubscribeFromStore = mobx_1.observe(store, 'location', onStoreChange);
            listener(store.location);
            return () => {
                unsubscribeFromStore();
            };
        },
        unsubscribe() {
            unsubscribeFromHistory();
        } });
};
//# sourceMappingURL=RouterStore.js.map