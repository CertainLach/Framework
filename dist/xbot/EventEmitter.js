"use strict";
class EventEmitter {
    constructor() {
        this.events = {};
    }
    on(event, handler) {
        if (this.events[event])
            throw new Error(`Event "${event}" handler is already defined!`);
        this.events[event] = handler;
    }
    emit(event, ...a) {
        this.events[event] && this.events[event](...a);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EventEmitter;
//# sourceMappingURL=EventEmitter.js.map