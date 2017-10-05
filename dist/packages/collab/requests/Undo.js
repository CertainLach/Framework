"use strict";
class UndoRequest {
    constructor(user, vector) {
        this.user = user;
        this.vector = vector;
    }
    toString() {
        return `UndoRequest(${[this.user, this.vector].join(", ")})`;
    }
    toHTML() {
        return `UndoRequest(${[this.user, this.vector.toHTML()].join(", ")})`;
    }
    copy() {
        return new UndoRequest(this.user, this.vector);
    }
    associatedRequest(log) {
        let sequence = 1;
        let index = log.indexOf(this);
        if (index == -1)
            index = log.length - 1;
        for (; index >= 0; index--) {
            if (log[index] === this || log[index].user != this.user)
                continue;
            if (log[index].vector.get(this.user) > this.vector.get(this.user))
                continue;
            if (log[index] instanceof UndoRequest)
                sequence += 1;
            else
                sequence -= 1;
            if (sequence == 0)
                return log[index];
        }
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = UndoRequest;
//# sourceMappingURL=Undo.js.map