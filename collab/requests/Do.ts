import Vector from '../Vector';
import {Operation} from '../Operation';
import State from '../State';
import NoOp from '../operations/NoOp';
import Delete from '../operations/Delete';

/** Initializes a new DoRequest object.
 *  @class Represents a request made by an user at a certain time.
 *  @param {number} user The user that issued the request
 *  @param {Vector} vector The time at which the request was issued
 *  @param {Operation} operation
 */
export default class DoRequest {
    user: number;
    vector: Vector;
    operation: Operation;

    constructor(user: number, vector: Vector, operation: Operation) {
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

    /** Applies the request to a State.
     *  @param {State} state The state to which the request should be applied.
     */
    execute(state: State) {
        this.operation.apply(state.buffer);

        state.vector = state.vector.incr(this.user, 1);

        return this;
    }

    /** Transforms this request against another request.
     *  @param {DoRequest} other
     *  @param {DoRequest} [cid] The concurrency ID of the two requests. This is
     *  the request that is to be transformed in case of conflicting operations.
     *  @type DoRequest
     */
    transform(other: DoRequest, cid?: DoRequest) {
        let newOperation;
        if (this.operation instanceof NoOp)
            newOperation = new NoOp();
        else {
            let op_cid;
            if (cid === this)
                op_cid = this.operation;
            if (cid == other)
                op_cid = other.operation;

            newOperation = this.operation.transform(other.operation, op_cid);
        }

        return new DoRequest(this.user, this.vector.incr(other.user),
            newOperation);
    }

    /** Mirrors the request. This inverts the operation and increases the issuer's
     *  component of the request time by the given amount.
     *  @param {number} [amount] The amount by which the request time is
     *  increased. Defaults to 1.
     *  @type DoRequest
     */
    mirror(amount) {
        if (typeof(amount) != "number")
            amount = 1;
        return new DoRequest(this.user, this.vector.incr(this.user, amount),
            this.operation.mirror());
    }

    /** Folds the request along another user's axis. This increases that user's
     *  component by the given amount, which must be a multiple of 2.
     *  @type DoRequest
     */
    fold(user, amount) {
        if (amount % 2 == 1)
            throw "Fold amounts must be multiples of 2.";
        return new DoRequest(this.user, this.vector.incr(user, amount),
            this.operation);
    }

    /** Makes a request reversible, given a translated version of this request
     *  and a State object. This only applies to requests carrying a Delete
     *  operation; for all others, this does nothing.
     *  @param {DoRequest} translated This request translated to the given state
     *  @param {State} state The state which is used to make the request
     *  reversible.
     *  @type DoRequest
     */
    makeReversible(translated, state) {
        const result = this.copy();

        if (this.operation instanceof Delete) {
            result.operation = this.operation.makeReversible(translated.operation,
                state);
        }

        return result;
    }
}