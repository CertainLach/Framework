"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const inferno_1 = require("inferno");
const reactive_1 = require("../reactive");
exports.TO_PRELOAD = [];
/**
 * Preloads all declared loadable components in app
 */
async function preloadAll() {
    let toPreload = exports.TO_PRELOAD;
    exports.TO_PRELOAD = [];
    await Promise.all(toPreload.map(e => e()));
}
exports.preloadAll = preloadAll;
var ErrorType;
(function (ErrorType) {
    ErrorType[ErrorType["NONE"] = 0] = "NONE";
    /**
     * Module failed to load in time
     */
    ErrorType[ErrorType["TIMEOUT_ERROR"] = 1] = "TIMEOUT_ERROR";
    /**
     * Module failed to load (import() call thrown error)
     */
    ErrorType[ErrorType["LOADING_ERROR"] = 2] = "LOADING_ERROR";
})(ErrorType = exports.ErrorType || (exports.ErrorType = {}));
class TimeoutError extends Error {
    constructor() {
        super('Component Loading Timeout');
    }
}
/**
 * Transform import to lazy loaded component
 * @param importFn Function which return promise from import() call
 * @param res Resolver for import, i.e if in imported module component is exported
 * as `export class MyElement extends Component`, then you should pass module=>module.MyElement to this argument
 * @param opts Loading component options
 */
function loadableComponent(importFn, res, opts) {
    // TODO: Are preloading is needed on client? May be for PWA?
    if (process.env.NODE) {
        exports.TO_PRELOAD.push(() => importFn());
    }
    let importPromise = null;
    let Loading = class Loading extends inferno_1.Component {
        constructor() {
            super(...arguments);
            this.state = {
                component: null,
                error: false,
                errorType: ErrorType.NONE
            };
        }
        // noinspection JSUnusedGlobalSymbols
        static preload() {
            if (importPromise === null)
                importPromise = importFn();
        }
        async componentDidMount() {
            try {
                let component = await Promise.race([importPromise === null ? (importPromise = importFn()) : importPromise, new Promise((res, rej) => {
                        if (opts.timeout)
                            setTimeout(() => rej(new TimeoutError()), opts.timeout);
                    })]);
                // Loaded
                this.setState({ component, error: false, errorType: ErrorType.NONE });
            }
            catch (e) {
                if (e instanceof TimeoutError) {
                    // Timeout
                    this.setState({
                        error: true,
                        errorType: ErrorType.TIMEOUT_ERROR
                    });
                }
                else {
                    // Loading error
                    this.setState({
                        error: true,
                        errorType: ErrorType.LOADING_ERROR
                    });
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
                let moduleId = importPromise['a'];
                const loaded = !!__webpack_modules__[moduleId];
                if (loaded) {
                    loadedModule = __webpack_require__(moduleId);
                    this.state.component = loadedModule;
                }
            }
            // Save module id to send all the required chunks on client request
            if (process.env.NODE)
                this.props.helmet.ssrData.preloadModules.push(importPromise['a']);
            if (loadedModule)
                LoadedComponent = res(loadedModule);
            // TODO: Make user return the Loading Element
            // TODO: Handle errors
            return LoadedComponent !== null ? <LoadedComponent {...this.props}/> : 'Загрузка';
        }
    };
    Loading = __decorate([
        reactive_1.inject('helmet')
    ], Loading);
    return Loading;
}
exports.default = loadableComponent;
//# sourceMappingURL=index.jsx.map