"use strict";
class NoOp {
    constructor() {
        this.requiresCID = false;
    }
    toString() {
        return "NoOp()";
    }
    apply(buffer) {
    }
    transform(other) {
        return new NoOp();
    }
    mirror() {
        return new NoOp();
    }
    toHTML() {
        return this.toString();
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NoOp;
//# sourceMappingURL=NoOp.js.map