export class InternalRocketNode {
    comment: 'Dont use it!';
    howToUse: 'Cast to inferno VNode, if you really want to use it';
}
export type IRef = (element: HTMLElement) => void;
export type RocketHtmlChildren = InternalRocketNode | string | number | Array<InternalRocketNode | string | number>;
export type IRocketArgumentHtmlProps = {
    classes: Array<string|false|null>
    ref: (element: HTMLElement) => void;
}
export type IRocketPassedHtmlProps = IRocketArgumentHtmlProps&{
    children: RocketHtmlChildren
}
export type RocketComponentLifecycle<P> = {
    onCatch?(e:Error): void;
    onMount?(): void;
    onUnmount?(): void;
    onUpdate?(): void;
    updateNeeded?(props?:P): boolean;
}
export class RocketComponentReactEventsProxy<P> implements RocketComponentLifecycle<P>{
    constructor(){}
    onCatch?(e?:Error): void;
    onMount?(): void;
    onUnmount?(): void;
    onUpdate?(): void;
    updateNeeded?(props?:P): boolean;

    private componentDidCatch(e:Error){
        this.onCatch&&this.onCatch(e);
    }
    private componentDidMount(){
        this.onMount&&this.onMount();
    }
    private componentWillUnmount(){
        this.onUnmount&&this.onUnmount();
    }
    private componentDidUpdate(){
        this.onUpdate&&this.onUpdate();
    }
    private shouldComponentUpdate(nextProps:P){
        return this.updateNeeded&&this.updateNeeded(nextProps);
    }
}
export enum ROCKET_COMPONENT_HOOK_MAP {
    onCatch = 'componentDidCatch',
    onMount = 'componentDidMount',
    onUnmount = 'componentWillUnmount',
    onUpdate = 'componentDidUpdate',
    updateNeeded = 'shouldComponentUpdate'
}
export enum ROCKET_FUNCTIONAL_HOOK_MAP{
    onMount = 'onComponentDidMount',
    onUnmount = 'onComponentWillUnmount',
    onUpdate = 'onComponentDidUpdate',
    updateNeeded = 'onComponentShouldUpdate'
}