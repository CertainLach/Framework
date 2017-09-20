import {autorun} from "./mobx";

export default class RocketStore {
    isClientSide: boolean = null;
    get isServerSide(): boolean{
        return !this.isClientSide;
    }

    dehydrationRequired: boolean;

    constructor(dehydrationRequired:boolean) {
        this.dehydrationRequired = dehydrationRequired;
    }

    runningAutorun: boolean = false;
    autorun?();

    onBeforeRehydrate() {

    }

    onAfterRehydrate() {

    }

    onBeforeDehydrate() {

    }

    onAfterDehydrate() {

    }
}

export type IStoreList = {[key:string]:RocketStore};


/**
 * Rehydrates stores, sets side, and starts autorun function on each
 * @param stores
 */
function initializeClientStoreList(stores:IStoreList) {
    const __SERVER_STORE__ = (window as any).__SERVER_STORE__;
    // Rehydration
    if (__SERVER_STORE__) {
        for (const miniStoreName in __SERVER_STORE__) {
            if (!__SERVER_STORE__.hasOwnProperty(miniStoreName)) {
                continue;
            }
            const miniStoreClient = stores[miniStoreName];
            if(!miniStoreClient.dehydrationRequired)
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
        delete (window as any).__SERVER_STORE__;
    }
    // Setting side
    for(const miniStore of Object.values<RocketStore>(stores)){
        miniStore.isClientSide=true;
    }
    // Starting autoruns
    for(const miniStore of Object.values<RocketStore>(stores)){
        if(miniStore.runningAutorun)
            continue;
        if(miniStore.autorun) {
            autorun(miniStore.autorun.bind(miniStore));
            miniStore.runningAutorun=true;
        }
    }
}

/**
 * Sets side
 * @param stores
 */
function initializeServerStoreList(stores:IStoreList){
    // Setting side
    for(const miniStore of Object.values(stores)){
        miniStore.isClientSide=false;
    }
}

/**
 * Stringifies state
 * @param stores
 */
function prepareServerStoreListToSend(stores){
    let json={};
    for(let miniStoreName in stores){
        if (!stores.hasOwnProperty(miniStoreName)) {
            continue;
        }
        let miniStoreServer=stores[miniStoreName];
        if(!miniStoreServer.dehydrationRequired)
            continue;
        miniStoreServer.onBeforeDehydrate();
        json[miniStoreName] = toJS(stores[miniStoreName], false);
        miniStoreServer.onAfterDehydrate();
    }
}