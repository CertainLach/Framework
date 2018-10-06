import { Component } from 'inferno';
import { inject } from '../reactive';
import { IDefaultStores } from '../stores';

export let TO_PRELOAD: (() => Promise<any>)[] = [];

/**
 * Preloads all declared loadable components in app
 */
export async function preloadAll() {
    let toPreload = TO_PRELOAD;
    TO_PRELOAD = [];
    await Promise.all(toPreload.map(e => e()));
}

export interface ILoadingProps {
    timeout?: 0
}
export enum ErrorType {
    NONE,
    /**
     * Module failed to load in time
     */
    TIMEOUT_ERROR,
    /**
     * Module failed to load (import() call thrown error)
     */
    LOADING_ERROR
}

class TimeoutError extends Error {
    constructor() {
        super('Component Loading Timeout')
    }
}

// Where the magic begins
declare var __webpack_modules__:any;
declare var __webpack_require__:any;

type IComponentWithPreload = { preload: () => void }

/**
 * Transform import to lazy loaded component
 * @param importFn Function which return promise from import() call
 * @param res Resolver for import, i.e if in imported module component is exported 
 * as `export class MyElement extends Component`, then you should pass module=>module.MyElement to this argument
 * @param opts Loading component options
 */
export default function loadableComponent<A, B extends new () => Component<any, any>>(importFn: () => Promise<A>, res: (a: A) => B, opts: ILoadingProps): B & IComponentWithPreload {
    // TODO: Are preloading is needed on client? May be for PWA?
    if (process.env.NODE) {
        TO_PRELOAD.push(() => importFn());
    }
    let importPromise:Promise<any> = null;
    @inject('helmet')
    class Loading extends Component<IDefaultStores>{
        // noinspection JSUnusedGlobalSymbols
        static preload() {
            if (importPromise === null)
                importPromise = importFn();
        }
        state: {
            component: A | null,
            error: boolean
            errorType: ErrorType
        } = {
            component: null,
            error: false,
            errorType: ErrorType.NONE
        };
        async componentDidMount() {
            try {
                let component = await Promise.race([importPromise === null ? (importPromise = importFn()) : importPromise, new Promise((res, rej) => {
                    if (opts.timeout)
                        setTimeout(() => rej(new TimeoutError()), opts.timeout);
                })]);
                // Loaded
                this.setState({ component, error: false, errorType: ErrorType.NONE });
            } catch (e) {
                if (e instanceof TimeoutError) {
                    // Timeout
                    this.setState({
                        error: true,
                        errorType: ErrorType.TIMEOUT_ERROR
                    })
                } else {
                    // Loading error
                    this.setState({
                        error: true,
                        errorType: ErrorType.LOADING_ERROR
                    })
                }
            }
        }
        render() {
            let loadedModule = this.state.component;
            let LoadedComponent = null;
            if (importPromise === null)
                importPromise = importFn();
            if (loadedModule === null) {
                // Check if already resolved (I.e already included in SSR process)
                // Uses magic of webpack internals and zarbis ["a"] field
                let moduleId = (importPromise as any)['a'];
                const loaded = !!__webpack_modules__[moduleId];
                if (loaded) {
                    loadedModule = __webpack_require__(moduleId);
                    this.state.component = loadedModule;
                }
            }
            // Save module id to send all the required chunks on client request
            if (process.env.NODE) this.props.helmet.ssrData.preloadModules.push((importPromise as any)['a']);
            if (loadedModule) LoadedComponent = res(loadedModule);
            // TODO: Make user return the Loading Element
            // TODO: Handle errors
            return LoadedComponent !== null ? <LoadedComponent {...this.props} /> : 'Загрузка';
        }
    }
    return Loading as any;
}