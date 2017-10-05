import { Props, VNode } from "inferno";
export interface RocketComponentLifecycle<P> {
    onMountEnd?(): void;
    onMountStart?(): void;
    onUpdateStart?(nextProps: P, nextContext: any): void;
    onUpdateEnd?(prevProps: P, prevContext: any): void;
    onUnmountStart?(): void;
    onProps?(nextProps: P, nextContext: any): void;
    isUpdateRequired?(nextProps: P, nextContext: any): boolean;
}
export default class RocketComponent<P> implements RocketComponentLifecycle<P> {
    static defaultProps: {};
    props: P & Props;
    context: any;
    _blockRender: boolean;
    _lastInput: any;
    _vNode: VNode | null;
    _unmounted: boolean;
    _lifecycle: any;
    _childContext: any;
    _isSVG: boolean;
    _updating: boolean;
    constructor(props?: P, context?: any);
    private cleanupIntervals();
    setTimeout: (callback: any, delta: any) => any;
    clearTimeout: (id: any) => void;
    setInterval: (callback: any, delta: any) => any;
    clearInterval: (id: any) => void;
    setImmediate: (callback: any, delta: any) => any;
    clearImmediate: (id: any) => void;
    onMountEnd?(): void;
    componentDidMount(): void;
    onMountStart?(): void;
    componentWillMount(): void;
    onProps?(nextProps: P, nextContext: any): void;
    componentWillReceiveProps(nextProps: P, nextContext: any): void;
    isUpdateRequired?(nextProps: P, nextContext: any): boolean;
    shouldComponentUpdate(nextProps: P, nextContext: any): boolean;
    onUpdateStart?(nextProps: P, nextContext: any): void;
    componentWillUpdate(nextProps: P, nextContext: any): void;
    onUpdateEnd?(prevProps: P, prevContext: any): void;
    componentDidUpdate(prevProps: P, prevContext: any): void;
    onUnmountStart?(): void;
    componentWillUnmount(): void;
    getChildContext?(): void;
    forceUpdate(callback?: Function): void;
    _updateComponent(prevProps: P & Props, nextProps: P & Props, context: any, force: boolean, fromSetState: boolean): VNode | string;
    render(nextProps?: P, nextContext?: any): any;
}
