"use strict";
const mobx_1 = require("./mobx");
class RocketStore {
    constructor(dehydrationRequired) {
        this.isClientSide = null;
        this.runningAutorun = false;
        this.dehydrationRequired = dehydrationRequired;
    }
    get isServerSide() {
        return !this.isClientSide;
    }
    onBeforeRehydrate() {
    }
    onAfterRehydrate() {
    }
    onBeforeDehydrate() {
    }
    onAfterDehydrate() {
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RocketStore;
function initializeClientStoreList(stores) {
    const __SERVER_STORE__ = window.__SERVER_STORE__;
    if (__SERVER_STORE__) {
        for (const miniStoreName in __SERVER_STORE__) {
            if (!__SERVER_STORE__.hasOwnProperty(miniStoreName)) {
                continue;
            }
            const miniStoreClient = stores[miniStoreName];
            if (!miniStoreClient.dehydrationRequired)
                continue;
            miniStoreClient.onBeforeRehydrate();
            const miniStoreServer = __SERVER_STORE__[miniStoreName];
            for (const miniStoreKey in miniStoreServer) {
                if (!miniStoreServer.hasOwnProperty(miniStoreKey)) {
                    continue;
                }
                miniStoreClient[miniStoreKey] = miniStoreServer[miniStoreKey];
            }
            miniStoreClient.onAfterRehydrate();
        }
        delete window.__SERVER_STORE__;
    }
    for (const miniStore of Object.values(stores)) {
        miniStore.isClientSide = true;
    }
    for (const miniStore of Object.values(stores)) {
        if (miniStore.runningAutorun)
            continue;
        if (miniStore.autorun) {
            mobx_1.autorun(miniStore.autorun.bind(miniStore));
            miniStore.runningAutorun = true;
        }
    }
}
function initializeServerStoreList(stores) {
    for (const miniStore of Object.values(stores)) {
        miniStore.isClientSide = false;
    }
}
function prepareServerStoreListToSend(stores) {
    let json = {};
    for (let miniStoreName in stores) {
        if (!stores.hasOwnProperty(miniStoreName)) {
            continue;
        }
        let miniStoreServer = stores[miniStoreName];
        if (!miniStoreServer.dehydrationRequired)
            continue;
        miniStoreServer.onBeforeDehydrate();
        json[miniStoreName] = toJS(stores[miniStoreName], false);
        miniStoreServer.onAfterDehydrate();
    }
}
//# sourceMappingURL=Store.js.map