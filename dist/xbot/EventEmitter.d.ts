export default class EventEmitter {
    events: any;
    constructor();
    on(event: string, handler: (any) => any): void;
    emit(event: string, ...a: any[]): void;
}
