import { useStore } from "../stores";
import PreloadStore, { LoadingItem } from "./PreloadStore";
import LoadingState from './LoadingState';
import React from 'react';
import ErrorType from "./ErrorType";

const { useState, useEffect } = React;

export class SSRLoadingError extends Error { }

export default <P>(key: string, promiseGetter: () => Promise<P>): ([LoadingState.ERRORED, Error] | [LoadingState.LOADING, null] | [LoadingState.LOADED, P]) => {
    const asyncStore = useStore(PreloadStore);
    // Setting this will force current component to rerender
    const [dummy, setDummy] = useState(0);
    let isMounted = true;
    useEffect(() => {
        return () => {
            delete asyncStore.items[key];
            delete asyncStore.promises[key];
            isMounted = false;
        }
    }, [key]);
    if (key in asyncStore.items) {
        const loaded = asyncStore.items[key];
        if (loaded.isError)
            return [LoadingState.ERRORED, loaded.error instanceof Error ? loaded.error : new SSRLoadingError(loaded.error)];
        else
            return [LoadingState.LOADED, loaded.value as any as P];
    };
    if (key in asyncStore.promises)
        return [LoadingState.LOADING, null];
    const promise = promiseGetter();
    asyncStore.promises[key] = promise as any;
    promise.then(e => {
        asyncStore.items[key] = LoadingItem.fromValue(e as any);
    }).catch(e => {
        /**
         * Avoid creating full stack trace on SSR
         */
        asyncStore.items[key] = LoadingItem.fromError(process.env.BROWSER ? e : e.message, ErrorType.LOADING_ERROR);
    }).finally(() => {
        delete asyncStore.promises[key];
        if (isMounted)
            setDummy(dummy + 1);
    });
    return [LoadingState.LOADING, null];
}