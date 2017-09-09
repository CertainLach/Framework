(function (dependencies, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    }
})(["require", "exports"], function (require, exports) {
    "use strict";
    var EventEmitter = (function () {
        /**
         * Micro event emitter, only one handler per event
         */
        function EventEmitter() {
            this.events = {};
        }
        /**
         * Define event handler
         * @param event
         * @param handler
         */
        EventEmitter.prototype.on = function (event, handler) {
            if (this.events[event])
                throw new Error("Event \"" + event + "\" handler is already defined!");
            this.events[event] = handler;
        };
        EventEmitter.prototype.emit = function (event) {
            var a = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                a[_i - 1] = arguments[_i];
            }
            this.events[event] && (_a = this.events)[event].apply(_a, a);
            var _a;
        };
        return EventEmitter;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = EventEmitter;
});
//# sourceMappingURL=EventEmitter.js.map