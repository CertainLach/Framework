import {
    action as actionD,
    observable,
    IObservableValue
} from 'mobx';
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
import {withRouter}from 'react-router';
import RocketComponent from './RocketComponent';
export { create, persist } from 'mobx-persist'
export const inject:(
    ...stores: string[]
)=>(target: any)=>any=injectD as any;
export function boxed<T>(initial:T):IObservableValue<T>{
    return observable.box(initial);
}
export function observer(component){
    return withRouter(observerD(component));
}
export const unboundAction=actionD;
export const action=actionD.bound;