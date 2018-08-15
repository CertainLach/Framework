import RocketStore from '../RocketStore';
import {enumerable} from '@meteor-it/decorators';
import {observable, action, observe} from 'mobx';

type HTML5Location = any;
type HTML5History = any;

export default class RouterStore extends RocketStore {
    @observable location:HTML5Location = null;

    history:HTML5History = null;

    constructor(history:HTML5History) {
        super(null, false);
        this.history=history;
    }

    @action
    updateLocation(newState:HTML5Location) {
        this.location = newState;
    }

    @action.bound
    push(location:string) {
        this.history.push(location);
    }
    @action.bound
    replace(location:string) {
        this.history.replace(location);
    }
    @action.bound
    go(n:string) {
        this.history.go(n);
    }
    @action.bound
    goBack() {
        this.history.goBack();
    }
    @action.bound
    goForward() {
        this.history.goForward();
    }

    historySubscribe:()=>void = null;
    onInit(){
        if(this.historySubscribe!==null)
            return;
        this.historySubscribe=this.history.listen((change:HTML5Location)=>{
            this.updateLocation(change);
        });
        this.updateLocation(this.history.location);
    }
    onDeinit(){
        if(this.historySubscribe!==null){
            this.historySubscribe();
            this.historySubscribe=null;
        }
    }
}
