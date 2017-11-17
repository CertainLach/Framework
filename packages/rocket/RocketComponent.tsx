import { Component, ReactNode, ReactInstance } from 'react';
import {timerMixin,ICallable,IId} from '@meteor-it/mixins';
import IAttributes from './r';

/**
 * Dirty hack to prevent usage of normal react methods (Prefer RocketComponent ones)
 */
type ComponentHackType={ new(props): any; };
const ComponentHack:ComponentHackType=Component as { new(): any; };
type RocketComponentConstructor<P> = new ()=>RocketComponent<P>;

// TODO: Typescheck
export default class RocketComponent<P> extends timerMixin(ComponentHack) {
    onMountEnd?(): void;
    onMountStart?(): void;
    onUnmountStart?(): void;
    onUnmountEnd?(): void;
    onCatch?(e:Error): void;
    render?(): Element|Element[]|string|null;
    
    constructor(props?:P){
        super(props);
    }
    props:P;
    prototype?:any;

    private componentDidCatch(e){
        this.onCatch&&this.onCatch(e);
    }
    private componentWillMount(){
        this.onMountStart&&this.onMountStart();
    }
    private componentDidMount(){
        this.onMountEnd&&this.onMountEnd();
    }
    private componentWillUnmount(){
        this.onUnmountStart&&this.onUnmountStart();
        this.onUnmountEnd&&this.onUnmountEnd();
    }
}
