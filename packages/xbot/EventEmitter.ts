export default class EventEmitter {
    events: any = {};

    /**
     * Micro event emitter, only one handler per event
     */
    constructor() { }
    /**
     * Define event handler
     * @param event 
     * @param handler 
     */
    on(event: string, handler: (any) => any) {
        if (this.events[event])
            throw new Error(`Event "${event}" handler is already defined!`);
        this.events[event] = handler;
    }
    emit(event: string, ...a: any[]) {
        this.events[event] && this.events[event](...a);
    }
}