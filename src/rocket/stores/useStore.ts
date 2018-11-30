import Store from "./store";
import {useContext} from "react";
import {isObservableArray, isObservableMap} from "mobx";
import RocketStoreContext from "./RocketStoreContext";

/**
 * Helper function that supports merging maps
 * @param target
 * @param source
 */
function mergeObservables(target:any, source:any) {
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
let storeList:{[key:string]:any} = null;

/**
 * Pulls __SSR_STORE__ to internal variable, must be called on client init
 */
export function cleanUpBrowserStoreList() {
    if (process.env.BROWSER) {
        storeList = (window as any).__SSR_STORE__;
        if(storeList)
            delete (window as any).__SSR_STORE__;
    }
}

/**
 * Reads static id field from Store subclass
 * @param e store subclass constructor
 */
function getStoreId<T extends Store>(e:new ()=>T):string {
    if(!('id' in e)||(e as any).id===null)
        throw new Error('store must have static id field which !== null');
    return (e as any).id;
}

/**
 * Given a context, creates or gets store from them
 * @param context context
 * @param e store constructor
 */
export function createOrDehydrateStore<T extends Store>(context:any,e:new()=>T):T{
    const id = getStoreId(e);
    if(!(id in context))
        (context as {[key:string]:Store})[id] = new (e as any)();
    if(storeList!==null&&id in storeList)
        mergeObservables(context[id],storeList[id]);
    return context[id];
}

/**
 * React hook for accessing Rocket store
 * @param e
 */
export default function useStore<T extends Store>(e:new ()=>T):T{
    const context = useContext(RocketStoreContext);
    return createOrDehydrateStore(context,e);
}