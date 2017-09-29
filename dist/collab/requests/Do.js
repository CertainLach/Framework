"use strict";
const NoOp_1 = require("../operations/NoOp");
const Delete_1 = require("../operations/Delete");
class DoRequest {
    constructor(user, vector, operation) {
        this.user = user;
        this.vector = vector;
        this.operation = operation;
    }
    toString() {
        return `DoRequest(${[this.user, this.vector, this.operation].join(", ")})`;
    }
    toHTML() {
        return `DoRequest(${[this.user, this.vector.toHTML(), this.operation.toHTML()].join(", ")})`;
    }
    copy() {
        return new DoRequest(this.user, this.vector, this.operation);
    }
    execute(state) {
        this.operation.apply(state.buffer);
        state.vector = state.vector.incr(this.user, 1);
        return this;
    }
    transform(other, cid) {
        let newOperation;
        if (this.operation instanceof NoOp_1.default)
            newOperation = new NoOp_1.default();
        else {
            let op_cid;
            if (cid === this)
                op_cid = this.operation;
            if (cid == other)
                op_cid = other.operation;
            newOperation = this.operation.transform(other.operation, op_cid);
        }
        return new DoRequest(this.user, this.vector.incr(other.user), newOperation);
    }
    mirror(amount = 1) {
        return new DoRequest(this.user, this.vector.incr(this.user, amount), this.operation.mirror());
    }
    fold(user, amount) {
        if (amount % 2 == 1)
            throw new Error("Fold amounts must be multiples of 2.");
        return new DoRequest(this.user, this.vector.incr(user, amount), this.operation);
    }
    makeReversible(translated, state) {
        const result = this.copy();
        if (this.operation instanceof Delete_1.default) {
            result.operation = this.operation.makeReversible(translated.operation, state);
        }
        return result;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = DoRequest;
//# sourceMappingURL=Do.js.map