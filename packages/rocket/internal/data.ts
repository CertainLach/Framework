export class InternalRocketNode {
    comment: 'Dont use it!';
    howToUse: 'Cast to react Node, if you really want to use it';
}
import {Component} from 'react';
export type RocketHtmlChildren = InternalRocketNode | string | number | Array<InternalRocketNode | string | number>;
export type IRocketArgumentHtmlProps = {
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

const ComponentHack = <new ()=>Object><any>Component;

export class RocketComponentReactEventsProxy<P> extends ComponentHack implements RocketComponentLifecycle<P>{
    onCatch?(e?:Error): void;
    onMount?(): void;
    onUnmount?(): void;
    onUpdate?(): void;
    updateNeeded?(props?:P): boolean;

    private componentDidCatch(e:Error):void{
        this.onCatch&&this.onCatch(e);
    }
    private componentDidMount():void{
        this.onMount&&this.onMount();
    }
    private componentWillUnmount():void{
        this.onUnmount&&this.onUnmount();
    }
    private componentDidUpdate():void{
        this.onUpdate&&this.onUpdate();
    }
    private shouldComponentUpdate(nextProps:P):boolean{
        return this.updateNeeded&&this.updateNeeded(nextProps);
    }
}