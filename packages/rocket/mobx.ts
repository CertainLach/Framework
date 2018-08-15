import {
    action as actionD,
    observable,
    IObservableValue
} from 'inferno';
import {
    inject as injectD,
    observer as observerD
}from 'mobx-react';
export {
    computed,
    observable,
    IObservableValue,
    autorun,
    toJS
} from 'mobx';
export {
    Provider
} from 'mobx-react';
// import {withRouter}from 'inferno-route';
import RocketComponent from './RocketComponent';
import {Component} from 'react';
// export { create, persist } from 'mobx-persist'
export const inject:(
    ...stores: string[]
)=>(target: any)=>any=injectD as any;
export function boxed<T>(initial:T):IObservableValue<T>{
    return observable.box(initial);
}
export function observer(component:RocketComponent<any>|Component<any>){
    return withRouter(observerD(<any>component));
}
export const unboundAction=actionD;
export const action=actionD.bound;