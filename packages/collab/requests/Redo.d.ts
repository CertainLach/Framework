import Vector from '../Vector';
import DoRequest from './Do';
import UndoRequest from './Undo';
export default class RedoRequest {
    user: number;
    vector: Vector;
    /**
     * Represents an redo request made by an user at a certain time
     * @param user
     * @param vector The time at which the request was issued
     */
    constructor(user: number, vector: Vector);
    toString(): string;
    toHTML(): string;
    copy(): RedoRequest;
    /**
     * Finds the corresponding UndoRequest to this RedoRequest
     * @param log The log to search
     */
    associatedRequest(log: Array<DoRequest | UndoRequest | RedoRequest>): UndoRequest;
}
