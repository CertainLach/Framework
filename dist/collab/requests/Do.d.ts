import Vector from '../Vector';
import { Operation } from '../Operation';
import State from '../State';
export default class DoRequest {
    user: number;
    vector: Vector;
    operation: Operation;
    /**
     * Represents a request made by an user at a certain time
     * @param user The user that issued the request
     * @param vector The time at which the request was issued
     * @param operation
     */
    constructor(user: number, vector: Vector, operation: Operation);
    toString(): string;
    toHTML(): string;
    copy(): DoRequest;
    /**
     * Applies the request to a State
     * @param state The state to which the request should be applied
     */
    execute(state: State): this;
    /**
     * Transforms this request against another request
     * @param other
     * @param cid The concurrency ID of the two requests. This is
     * the request that is to be transformed in case of conflicting operations.
     */
    transform(other: DoRequest, cid?: DoRequest): DoRequest;
    /**
     * Mirrors the request. This inverts the operation and increases the issuer's
     * component of the request time by the given amount
     * @param amount The amount by which the request time is increased
     */
    mirror(amount?: number): DoRequest;
    /**
     * Folds the request along another user's axis. This increases that user's
     * component by the given amount, which must be a multiple of 2.
     * @param user
     * @param amount
     */
    fold(user: number, amount: number): DoRequest;
    /**
     * Makes a request reversible, given a translated version of this request
     * and a State object. This only applies to requests carrying a Delete
     * operation; for all others, this does nothing
     * @param translated This request translated to the given state
     * @param state The state which is used to make the request
     * reversible.
     */
    makeReversible(translated: DoRequest, state: State): DoRequest;
}
