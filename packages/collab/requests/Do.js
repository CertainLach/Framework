import NoOp from '../operations/NoOp';
import Delete from '../operations/Delete';
var DoRequest = /** @class */ (function () {
    /**
     * Represents a request made by an user at a certain time
     * @param user The user that issued the request
     * @param vector The time at which the request was issued
     * @param operation
     */
    function DoRequest(user, vector, operation) {
        this.user = user;
        this.vector = vector;
        this.operation = operation;
    }
    DoRequest.prototype.toString = function () {
        return "DoRequest(" + [this.user, this.vector, this.operation].join(", ") + ")";
    };
    DoRequest.prototype.toHTML = function () {
        return "DoRequest(" + [this.user, this.vector.toHTML(), this.operation.toHTML()].join(", ") + ")";
    };
    DoRequest.prototype.copy = function () {
        return new DoRequest(this.user, this.vector, this.operation);
    };
    /**
     * Applies the request to a State
     * @param state The state to which the request should be applied
     */
    DoRequest.prototype.execute = function (state) {
        this.operation.apply(state.buffer);
        state.vector = state.vector.incr(this.user, 1);
        return this;
    };
    /**
     * Transforms this request against another request
     * @param other
     * @param cid The concurrency ID of the two requests. This is
     * the request that is to be transformed in case of conflicting operations.
     */
    DoRequest.prototype.transform = function (other, cid) {
        var newOperation;
        if (this.operation instanceof NoOp)
            newOperation = new NoOp();
        else {
            var op_cid = void 0;
            if (cid === this)
                op_cid = this.operation;
            if (cid == other)
                op_cid = other.operation;
            newOperation = this.operation.transform(other.operation, op_cid);
        }
        return new DoRequest(this.user, this.vector.incr(other.user), newOperation);
    };
    /**
     * Mirrors the request. This inverts the operation and increases the issuer's
     * component of the request time by the given amount
     * @param amount The amount by which the request time is increased
     */
    DoRequest.prototype.mirror = function (amount) {
        if (amount === void 0) { amount = 1; }
        return new DoRequest(this.user, this.vector.incr(this.user, amount), this.operation.mirror());
    };
    /**
     * Folds the request along another user's axis. This increases that user's
     * component by the given amount, which must be a multiple of 2.
     * @param user
     * @param amount
     */
    DoRequest.prototype.fold = function (user, amount) {
        if (amount % 2 == 1)
            throw new Error("Fold amounts must be multiples of 2.");
        return new DoRequest(this.user, this.vector.incr(user, amount), this.operation);
    };
    /**
     * Makes a request reversible, given a translated version of this request
     * and a State object. This only applies to requests carrying a Delete
     * operation; for all others, this does nothing
     * @param translated This request translated to the given state
     * @param state The state which is used to make the request
     * reversible.
     */
    DoRequest.prototype.makeReversible = function (translated, state) {
        var result = this.copy();
        if (this.operation instanceof Delete) {
            result.operation = this.operation.makeReversible(translated.operation, state);
        }
        return result;
    };
    return DoRequest;
}());
export default DoRequest;
//# sourceMappingURL=Do.js.map