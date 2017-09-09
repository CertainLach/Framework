export default class EventEmitter {
    events: any;
    /**
     * Micro event emitter, only one handler per event
     */
    constructor();
    /**
     * Define event handler
     * @param event
     * @param handler
     */
    on(event: string, handler: (any) => any): void;
    emit(event: string, ...a: any[]): void;
}
