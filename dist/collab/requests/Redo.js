(function (dependencies, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    }
})(["require", "exports"], function (require, exports) {
    "use strict";
    var RedoRequest = (function () {
        /**
         * Represents an redo request made by an user at a certain time
         * @param user
         * @param vector The time at which the request was issued
         */
        function RedoRequest(user, vector) {
            this.user = user;
            this.vector = vector;
        }
        RedoRequest.prototype.toString = function () {
            return "RedoRequest(" + [this.user, this.vector].join(", ") + ")";
        };
        RedoRequest.prototype.toHTML = function () {
            return "RedoRequest(" + [this.user, this.vector.toHTML()].join(", ") + ")";
        };
        RedoRequest.prototype.copy = function () {
            return new RedoRequest(this.user, this.vector);
        };
        /**
         * Finds the corresponding UndoRequest to this RedoRequest
         * @param log The log to search
         */
        RedoRequest.prototype.associatedRequest = function (log) {
            var sequence = 1;
            var index = log.indexOf(this);
            if (index == -1)
                index = log.length - 1;
            for (; index >= 0; index--) {
                if (log[index] === this || log[index].user != this.user)
                    continue;
                if (log[index].vector.get(this.user) > this.vector.get(this.user))
                    continue;
                if (log[index] instanceof RedoRequest)
                    sequence += 1;
                else
                    sequence -= 1;
                if (sequence == 0)
                    return log[index];
            }
        };
        return RedoRequest;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = RedoRequest;
});
//# sourceMappingURL=Redo.js.map