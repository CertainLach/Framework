import { isBrowserEnvironment } from "@meteor-it/utils";
import { isObservableArray, isObservableMap } from "mobx";
import * as remotedev from 'mobx-remotedev';
import { useContext } from "react";
import RocketStoreContext from "./RocketStoreContext";
import Store from "./store";

/**
 * Helper function that supports merging maps
 * @param target
 * @param source
 */
function mergeObservables(target: any, source: any) {
    if (!source) {
        return;
    } else {
        Object.keys(source).forEach(key => {
            if (typeof target[key] === 'object') {
                if (isObservableMap(target[key])) return target[key].merge(source[key]);
                if (isObservableArray(target[key])) return target[key].replace(source[key]);
                target[key] = source[key];
            } else {
                target[key] = source[key];
            }
        });
    }
}

/**
 * Stores from SSR (Pulled here by cleanUpBrowserStoreList)
 */
let storeList: { [key: string]: any } | null = null;

/**
 * Pulls __SSR_STORE__ to internal variable, must be called on client init
 */
export function cleanUpBrowserStoreList() {
    if (isBrowserEnvironment()) {
        if ('__SSR_STORE__' in window) {
            storeList = (window as any).__SSR_STORE__;
            delete (window as any).__SSR_STORE__;
            if (!storeList) storeList = {};
        } else {
            storeList = {};
        }
    }
}

/**
 * Reads static id field from Store subclass
 * @param e store subclass constructor
 */
function getStoreId<T extends Store>(e: new () => T): string {
    if (!('id' in e) || (e as any).id === null)
        throw new Error('store must have static id field which !== null');
    return (e as any).id;
}

/**
 * Given a context, creates or gets store from them
 * @param context context
 * @param e store constructor
 */
export function createOrDehydrateStore<T extends Store>(context: any, e: new () => T): T {
    const id = getStoreId(e);
    if (!(id in context)) {
        const store = new (e as any)();
        (context as { [key: string]: Store })[id] = store;
        if (process.env.NODE_ENV === 'development') {
            (remotedev as any)(store);
        }
    }
    if (storeList !== null && id in storeList) {
        mergeObservables(context[id], storeList[id]);
        delete storeList[id];
        if (Object.keys(storeList).length === 0) {
            storeList = null;
        }
    }
    return context[id];
}

/**
 * React hook for accessing Rocket store
 * @param e
 */
export default function useStore<T extends Store>(e: new () => T): T {
    const context = useContext(RocketStoreContext);
    return createOrDehydrateStore(context, e);
}
