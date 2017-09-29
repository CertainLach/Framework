// = https://github.com/infernojs/inferno/blob/master/packages/inferno-component/src/index.ts

import {
    createVNode,
    EMPTY_OBJ,
    internal_DOMNodeMap,
    internal_patch,
    options,
    Props,
    VNode
} from "inferno";
import {
    combineFrom,
    ERROR_MSG,
    isArray,
    isFunction,
    isInvalid,
    isNull,
    isNullOrUndef,
    isStringOrNumber,
    NO_OP,
    throwError
} from "inferno-shared";
import VNodeFlags from "inferno-vnode-flags";

const componentCallbackQueue: Map<any, Function[]> = new Map();

export interface RocketComponentLifecycle<P> {

    onMountEnd?(): void;
    onMountStart?(): void;

    onUpdateStart?(nextProps: P, nextContext: any): void;
    onUpdateEnd?(prevProps: P, prevContext: any): void;

    onUnmountStart?(): void;

    onProps?(nextProps: P, nextContext: any): void;

    isUpdateRequired?(nextProps: P, nextContext: any): boolean;
}

// when a components root VNode is also a component, we can run into issues
// this will recursively look for vNode.parentNode if the VNode is a component
function updateParentComponentVNodes(vNode: VNode, dom: Element) {
    if (vNode.flags & VNodeFlags.Component) {
        const parentVNode = vNode.parentVNode;

        if (parentVNode) {
            parentVNode.dom = dom;
            updateParentComponentVNodes(parentVNode, dom);
        }
    }
}

function applyState<P>(
    component: RocketComponent<P>,
    force: boolean,
    callback?: Function
): void {
    if (component._unmounted) {
        return;
    }
    if (force || !component._blockRender) {
        const props = component.props as P;
        const context = component.context;

        let nextInput: VNode;
        const renderOutput = component._updateComponent(
            props,
            props,
            context,
            force,
            true
        );
        let didUpdate = true;

        if (isInvalid(renderOutput)) {
            nextInput = createVNode(VNodeFlags.Void, null);
        } else if (renderOutput === NO_OP) {
            nextInput = component._lastInput;
            didUpdate = false;
        } else if (isStringOrNumber(renderOutput)) {
            nextInput = createVNode(
                VNodeFlags.Text,
                null,
                null,
                renderOutput
            ) as VNode;
        } else if (isArray(renderOutput)) {
            if (process.env.NODE_ENV !== "production") {
                throwError("render() return is not a element / null");
            }
            return throwError();
        } else {
            nextInput = renderOutput;
        }

        const lastInput = component._lastInput as VNode;
        const vNode = component._vNode as VNode;
        const parentDom =
            (lastInput.dom && lastInput.dom.parentNode) ||
            (lastInput.dom = vNode.dom);

        if (nextInput.flags & VNodeFlags.Component) {
            nextInput.parentVNode = vNode;
        }
        component._lastInput = nextInput as VNode;
        if (didUpdate) {
            let childContext;

            if (!isNullOrUndef(component.getChildContext)) {
                childContext = component.getChildContext();
            }

            if (isNullOrUndef(childContext)) {
                childContext = component._childContext;
            } else {
                childContext = combineFrom(context, childContext as any);
            }

            const lifeCycle = component._lifecycle as any;
            internal_patch(
                lastInput,
                nextInput as VNode,
                parentDom as Element,
                lifeCycle,
                childContext,
                component._isSVG,
                false
            );

            // If this component was unmounted by its parent, do nothing. This is no-op
            if (component._unmounted) {
                return;
            }

            lifeCycle.trigger();

            if (!isNullOrUndef(component.onUpdateEnd)) {
                component.onUpdateEnd(props, context);
            }
            if (!isNull(options.afterUpdate)) {
                options.afterUpdate(vNode);
            }
        }
        const dom = (vNode.dom = (nextInput as VNode).dom as Element);
        if (options.findDOMNodeEnabled) {
            internal_DOMNodeMap.set(component, (nextInput as VNode).dom);
        }

        updateParentComponentVNodes(vNode, dom);
    }
    if (!isNullOrUndef(callback)) {
        callback.call(component);
    }
}

function setter(_setter, _clearer, array) {
    return function(callback, delta) {
        const id = _setter(function() {
            _clearer.call(this, id);
            callback.apply(this, arguments);
        }.bind(this), delta);

        if (!this[array]) {
            this[array] = [id];
        } else {
            this[array].push(id);
        }
        return id;
    };
}

function clearer (_clearer, array) {
    return function(id) {
        if (this[array]) {
            const index = this[array].indexOf(id);
            if (index !== -1) {
                this[array].splice(index, 1);
            }
        }
        _clearer(id);
    };
}

const timeouts=Symbol('rocket.timeouts');
const _clearTimeout = clearer(clearTimeout, timeouts);
const _setTimeout = setter(setTimeout, _clearTimeout, timeouts);

const intervals=Symbol('rocket.intervals');
const _clearInterval = clearer(clearInterval, intervals);
const _setInterval = setter(setInterval, ()=>{}, intervals);

const immediates=Symbol('rocket.immediates');
const _clearImmediate = clearer(clearImmediate, immediates);
const _setImmediate = setter(setImmediate, _clearImmediate, immediates);

export default class RocketComponent<P> implements RocketComponentLifecycle<P> {
    public static defaultProps: {};
    public props: P & Props;
    public context: any;
    public _blockRender = false;
    public _lastInput: any = null;
    public _vNode: VNode | null = null;
    public _unmounted = false;
    public _lifecycle = null;
    public _childContext = null;
    public _isSVG = false;
    public _updating = true;

    constructor(props?: P, context?: any) {
        this.props = props || (EMPTY_OBJ as P);
        this.context = context || EMPTY_OBJ; // context should not be mutable
    }

    private cleanupIntervals () {
        this[timeouts].forEach(id=>clearTimeout(id));
        this[intervals].forEach(id=>clearInterval(id));
        this[immediates].forEach(id=>clearImmediate(id));
    }

    setTimeout = _setTimeout;
    clearTimeout = _clearTimeout;

    setInterval = _setInterval;
    clearInterval = _clearInterval;

    setImmediate = _setImmediate;
    clearImmediate = _clearImmediate;

    // LifeCycle methods
    public onMountEnd?(): void;
    componentDidMount(): void{
        this.onMountEnd();
    }

    public onMountStart?(): void;
    componentWillMount(): void{
        this.onMountStart();
    }

    public onProps?(nextProps: P, nextContext: any): void;
    componentWillReceiveProps(nextProps: P, nextContext: any): void {
        this.onProps(nextProps, nextContext);
    }

    public isUpdateRequired?(nextProps: P, nextContext: any): boolean;
    shouldComponentUpdate(nextProps: P, nextContext: any): boolean {
        return this.isUpdateRequired(nextProps, nextContext);
    }

    public onUpdateStart?(nextProps: P, nextContext: any): void;
    componentWillUpdate(nextProps: P, nextContext: any): void{
        this.onUpdateStart(nextProps, nextContext);
    }

    public onUpdateEnd?(prevProps: P, prevContext: any): void;
    componentDidUpdate(prevProps: P, prevContext: any): void{
        this.onUpdateEnd(prevProps,prevContext);
    }

    public onUnmountStart?(): void;
    componentWillUnmount(): void{
        this.cleanupIntervals();
        this.onUnmountStart();
    }

    public getChildContext?(): void;

    public forceUpdate(callback?: Function) {
        if (this._unmounted) {
            return;
        }

        applyState(this, true, callback);
    }


    public _updateComponent(
        prevProps: P & Props,
        nextProps: P & Props,
        context: any,
        force: boolean,
        fromSetState: boolean
    ): VNode | string {
        if (this._unmounted === true) {
            if (process.env.NODE_ENV !== "production") {
                throwError('Error on update! (Component is unmounted!)');
            }
            throwError();
        }
        if (
            prevProps !== nextProps ||
            nextProps === EMPTY_OBJ ||
            force
        ) {
            if (prevProps !== nextProps || nextProps === EMPTY_OBJ) {
                if (!isNullOrUndef(this.onProps) && !fromSetState) {
                    this._blockRender = true;
                    this.onProps(nextProps, context);
                    // If this component was removed during its own update do nothing...
                    if (this._unmounted) {
                        return NO_OP;
                    }
                    this._blockRender = false;
                }
            }

            /* Update if scu is not defined, or it returns truthy value or force */
            if (
                force ||
                isNullOrUndef(this.isUpdateRequired) ||
                (this.isUpdateRequired &&
                    this.isUpdateRequired(nextProps, context))
            ) {
                if (!isNullOrUndef(this.onUpdateStart)) {
                    this.onUpdateStart(nextProps, context);
                }

                this.props = nextProps;
                this.context = context;

                if (options.beforeRender) {
                    options.beforeRender(this);
                }
                const render = this.render(nextProps, context);

                if (options.afterRender) {
                    options.afterRender(this);
                }

                return render;
            } else {
                this.props = nextProps;
                this.context = context;
            }
        }
        return NO_OP;
    }

    // tslint:disable-next-line:no-empty
    public render(nextProps?: P, nextContext?): any {}
}