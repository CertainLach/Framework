"use strict";
const inferno_1 = require("inferno");
const inferno_shared_1 = require("inferno-shared");
const inferno_vnode_flags_1 = require("inferno-vnode-flags");
const componentCallbackQueue = new Map();
function updateParentComponentVNodes(vNode, dom) {
    if (vNode.flags & inferno_vnode_flags_1.default.Component) {
        const parentVNode = vNode.parentVNode;
        if (parentVNode) {
            parentVNode.dom = dom;
            updateParentComponentVNodes(parentVNode, dom);
        }
    }
}
function applyState(component, force, callback) {
    if (component._unmounted) {
        return;
    }
    if (force || !component._blockRender) {
        const props = component.props;
        const context = component.context;
        let nextInput;
        const renderOutput = component._updateComponent(props, props, context, force, true);
        let didUpdate = true;
        if (inferno_shared_1.isInvalid(renderOutput)) {
            nextInput = inferno_1.createVNode(inferno_vnode_flags_1.default.Void, null);
        }
        else if (renderOutput === inferno_shared_1.NO_OP) {
            nextInput = component._lastInput;
            didUpdate = false;
        }
        else if (inferno_shared_1.isStringOrNumber(renderOutput)) {
            nextInput = inferno_1.createVNode(inferno_vnode_flags_1.default.Text, null, null, renderOutput);
        }
        else if (inferno_shared_1.isArray(renderOutput)) {
            if (process.env.NODE_ENV !== "production") {
                inferno_shared_1.throwError("render() return is not a element / null");
            }
            return inferno_shared_1.throwError();
        }
        else {
            nextInput = renderOutput;
        }
        const lastInput = component._lastInput;
        const vNode = component._vNode;
        const parentDom = (lastInput.dom && lastInput.dom.parentNode) ||
            (lastInput.dom = vNode.dom);
        if (nextInput.flags & inferno_vnode_flags_1.default.Component) {
            nextInput.parentVNode = vNode;
        }
        component._lastInput = nextInput;
        if (didUpdate) {
            let childContext;
            if (!inferno_shared_1.isNullOrUndef(component.getChildContext)) {
                childContext = component.getChildContext();
            }
            if (inferno_shared_1.isNullOrUndef(childContext)) {
                childContext = component._childContext;
            }
            else {
                childContext = inferno_shared_1.combineFrom(context, childContext);
            }
            const lifeCycle = component._lifecycle;
            inferno_1.internal_patch(lastInput, nextInput, parentDom, lifeCycle, childContext, component._isSVG, false);
            if (component._unmounted) {
                return;
            }
            lifeCycle.trigger();
            if (!inferno_shared_1.isNullOrUndef(component.onUpdateEnd)) {
                component.onUpdateEnd(props, context);
            }
            if (!inferno_shared_1.isNull(inferno_1.options.afterUpdate)) {
                inferno_1.options.afterUpdate(vNode);
            }
        }
        const dom = (vNode.dom = nextInput.dom);
        if (inferno_1.options.findDOMNodeEnabled) {
            inferno_1.internal_DOMNodeMap.set(component, nextInput.dom);
        }
        updateParentComponentVNodes(vNode, dom);
    }
    if (!inferno_shared_1.isNullOrUndef(callback)) {
        callback.call(component);
    }
}
function setter(_setter, _clearer, array) {
    return function (callback, delta) {
        const id = _setter(function () {
            _clearer.call(this, id);
            callback.apply(this, arguments);
        }.bind(this), delta);
        if (!this[array]) {
            this[array] = [id];
        }
        else {
            this[array].push(id);
        }
        return id;
    };
}
function clearer(_clearer, array) {
    return function (id) {
        if (this[array]) {
            const index = this[array].indexOf(id);
            if (index !== -1) {
                this[array].splice(index, 1);
            }
        }
        _clearer(id);
    };
}
const timeouts = Symbol('rocket.timeouts');
const _clearTimeout = clearer(clearTimeout, timeouts);
const _setTimeout = setter(setTimeout, _clearTimeout, timeouts);
const intervals = Symbol('rocket.intervals');
const _clearInterval = clearer(clearInterval, intervals);
const _setInterval = setter(setInterval, () => { }, intervals);
const immediates = Symbol('rocket.immediates');
const _clearImmediate = clearer(clearImmediate, immediates);
const _setImmediate = setter(setImmediate, _clearImmediate, immediates);
class RocketComponent {
    constructor(props, context) {
        this._blockRender = false;
        this._lastInput = null;
        this._vNode = null;
        this._unmounted = false;
        this._lifecycle = null;
        this._childContext = null;
        this._isSVG = false;
        this._updating = true;
        this.setTimeout = _setTimeout;
        this.clearTimeout = _clearTimeout;
        this.setInterval = _setInterval;
        this.clearInterval = _clearInterval;
        this.setImmediate = _setImmediate;
        this.clearImmediate = _clearImmediate;
        this.props = props || inferno_1.EMPTY_OBJ;
        this.context = context || inferno_1.EMPTY_OBJ;
    }
    cleanupIntervals() {
        this[timeouts].forEach(id => clearTimeout(id));
        this[intervals].forEach(id => clearInterval(id));
        this[immediates].forEach(id => clearImmediate(id));
    }
    componentDidMount() {
        this.onMountEnd();
    }
    componentWillMount() {
        this.onMountStart();
    }
    componentWillReceiveProps(nextProps, nextContext) {
        this.onProps(nextProps, nextContext);
    }
    shouldComponentUpdate(nextProps, nextContext) {
        return this.isUpdateRequired(nextProps, nextContext);
    }
    componentWillUpdate(nextProps, nextContext) {
        this.onUpdateStart(nextProps, nextContext);
    }
    componentDidUpdate(prevProps, prevContext) {
        this.onUpdateEnd(prevProps, prevContext);
    }
    componentWillUnmount() {
        this.cleanupIntervals();
        this.onUnmountStart();
    }
    forceUpdate(callback) {
        if (this._unmounted) {
            return;
        }
        applyState(this, true, callback);
    }
    _updateComponent(prevProps, nextProps, context, force, fromSetState) {
        if (this._unmounted === true) {
            if (process.env.NODE_ENV !== "production") {
                inferno_shared_1.throwError('Error on update! (Component is unmounted!)');
            }
            inferno_shared_1.throwError();
        }
        if (prevProps !== nextProps ||
            nextProps === inferno_1.EMPTY_OBJ ||
            force) {
            if (prevProps !== nextProps || nextProps === inferno_1.EMPTY_OBJ) {
                if (!inferno_shared_1.isNullOrUndef(this.onProps) && !fromSetState) {
                    this._blockRender = true;
                    this.onProps(nextProps, context);
                    if (this._unmounted) {
                        return inferno_shared_1.NO_OP;
                    }
                    this._blockRender = false;
                }
            }
            if (force ||
                inferno_shared_1.isNullOrUndef(this.isUpdateRequired) ||
                (this.isUpdateRequired &&
                    this.isUpdateRequired(nextProps, context))) {
                if (!inferno_shared_1.isNullOrUndef(this.onUpdateStart)) {
                    this.onUpdateStart(nextProps, context);
                }
                this.props = nextProps;
                this.context = context;
                if (inferno_1.options.beforeRender) {
                    inferno_1.options.beforeRender(this);
                }
                const render = this.render(nextProps, context);
                if (inferno_1.options.afterRender) {
                    inferno_1.options.afterRender(this);
                }
                return render;
            }
            else {
                this.props = nextProps;
                this.context = context;
            }
        }
        return inferno_shared_1.NO_OP;
    }
    render(nextProps, nextContext) { }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = RocketComponent;
//# sourceMappingURL=RocketComponent.js.map