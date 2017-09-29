import {observable,observe,action as unboundAction, autorun, toJS,computed} from "mobx";
import {connect,observer,Provider,inject} from 'inferno-mobx'
const action = unboundAction.bound;
export {
    observable, observe, action,
    unboundAction, connect, observer,
    Provider, autorun, toJS,
    computed, inject
};