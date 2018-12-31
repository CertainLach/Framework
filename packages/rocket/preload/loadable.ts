import React, { ReactNode } from 'react';
import useStore from "../stores/useStore";
import HelmetStore from "../helmet/HelmetStore";
import { h } from "../h";
import TO_PRELOAD from './TO_PRELOAD';
import ErrorType from './ErrorType';
import TimeoutError from './TimeoutError';
import LoadingState from './LoadingState';

const { Component, useEffect, useState } = React;

export type ILoadingStatus = {
    state: LoadingState;
    error: ErrorType;
    tryAgain: () => void;
}

export interface ILoadingProps {
    timeout?: 0,
    loading: (e: ILoadingStatus) => ReactNode
}
export type IComponentPreloadMixin = { preload: () => void }

/**
 * Transform import to lazy loaded component
 * @param importFn Function which return promise from import() call
 * @param res Resolver for import, i.e if in imported module component is exported
 * as `export class MyElement extends Component`, then you should pass module=>module.MyElement to this argument
 * @param opts Loading component options
 */
export default function loadable<A, B>(importFn: () => Promise<A>, res: (a: A) => B, opts: ILoadingProps): B & IComponentPreloadMixin {
    // TODO: Are preloading is needed on client? May be for PWA?
    if (process.env.NODE) {
        TO_PRELOAD.push(() => importFn());
    }
    let importPromise: Promise<any> = null;
    // TODO: Extract magic somehow ('a' field of import promise)
    const Loading = (props: any) => {
        const helmetStore = useStore(HelmetStore);
        const [component, setComponent] = useState(null);
        const [error, setError] = useState(ErrorType.NONE);
        const [effectRequired, setEffectRequired] = useState(true);
        useEffect(() => {
            if (!effectRequired) return;
            setEffectRequired(false);
            Promise.race([importPromise === null ? (importPromise = importFn()) : importPromise, new Promise((res, rej) => {
                if (opts.timeout)
                    setTimeout(() => rej(new TimeoutError()), opts.timeout);
            })]).then(component => {
                setComponent(component);
                setError(ErrorType.NONE);
            }).catch(e => {
                if (e instanceof TimeoutError)
                    setError(ErrorType.TIMEOUT_ERROR);
                else
                    setError(ErrorType.LOADING_ERROR);
            })
        });

        let loadedModule = component;
        let LoadedComponent = null;
        if (importPromise === null)
            importPromise = importFn();
        if (loadedModule === null) {
            // Check if already resolved (I.e already included in SSR process)
            // Uses magic of webpack internals and zarbis ["a"] field
            // TODO: Document this magic (This field can be seen only in zarbis source code)
            let moduleId = (importPromise as any)['a'];
            const loaded = !!__webpack_modules__[moduleId];
            if (loaded) {
                loadedModule = __webpack_require__(moduleId);
                setComponent(loadedModule);
            }
        }
        // Save module id to send all the required chunks on client request
        if (process.env.NODE) helmetStore.ssrData.preloadModules.push((importPromise as any)['a']);
        if (loadedModule) LoadedComponent = res(loadedModule);
        return LoadedComponent !== null ? h(LoadedComponent, props) : opts.loading({
            state: error !== ErrorType.NONE ? LoadingState.ERRORED : LoadingState.LOADING,
            error,
            tryAgain: error === ErrorType.NONE ? () => { } : () => {
                setEffectRequired(true);
                setError(ErrorType.NONE);
            }
        });
    };
    Loading.preload = () => {
        if (importPromise === null)
            importPromise = importFn();
    };
    return Loading as any;
};
