export {default} from './RocketApp';
export {default as RocketComponent} from './RocketComponent';
export {default as RocketStore} from './RocketStore';
export {
    IObservableValue,
    inject,
    boxed,
    observable,
    observer,
    Provider,
    autorun,
    unboundAction,
    action,
    computed,
    toJS,
    persist
} from './mobx';
export {r} from './r';
export {Link,NavLink,Router,Switch,Route,Redirect,Prompt} from './router';
export {Input} from './elements';

namespace global{
    declare module "*.less"{
        var a:{[key:string]:string};
        export=a;
    }
}