import RocketStore from '../RocketStore';
import {enumerable} from '@meteor-it/decorators';
import {observable, action, observe} from 'mobx';

export default class RouterStore extends RocketStore {
    @observable location = null;

    history = null;

    constructor(history) {
        super(null, false);
        this.history=history;
    }

    @action
    updateLocation(newState) {
        this.location = newState;
    }

    @action.bound
    push(location) {
        this.history.push(location);
    }
    @action.bound
    replace(location) {
        this.history.replace(location);
    }
    @action.bound
    go(n) {
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

    historySubscribe = null;
    onInit(){
        if(this.historySubscribe!==null)
            return;
        this.historySubscribe=this.history.listen(change=>{
            this.updateLocation(change);
        });
        // console.log(this.history);
        this.updateLocation(this.history.location);
    }
    onDeinit(){
        if(this.historySubscribe!==null){
            this.historySubscribe();
            this.historySubscribe=null;
        }
    }
}
