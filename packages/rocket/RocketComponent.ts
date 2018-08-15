import {timerMixin,ICallable,IId} from '@meteor-it/mixins';
import {RocketComponentReactEventsProxy} from "./internal/data";

/**
 * Dirty hack to prevent usage of normal react methods (Prefer RocketComponent ones)
 */

// TODO: Typescheck
export default class RocketComponent<P,C=void> extends timerMixin(RocketComponentReactEventsProxy) {
    onMount?(): void;
    onBeforeMount?(): void;
    onUnmount?(): void;
    onCatch?(e:Error): void;
    render?(): Element|Element[]|string|null;
    props:P&{children?:C};

    constructor(props?:P){
        super();
        this.props=props;
    }
    private componentDidCatch(e:Error){
        this.onCatch&&this.onCatch(e);
    }
    private componentWillMount(){
        this.onBeforeMount&&this.onBeforeMount();
    }
    private componentDidMount(){
        this.onMount&&this.onMount();
    }
    private componentWillUnmount(){
        this.onUnmount&&this.onUnmount();
    }
}
