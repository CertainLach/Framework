export default class EventEmitter{
    constructor(){
        this.events={};
    }
    on(event,handler){
        this.events[event]=handler;
    }
    emit(event,...a){
        this.events[event]&&this.events[event](...a);
    }
}