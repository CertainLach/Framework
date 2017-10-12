import Vector from '../Vector';
import DoRequest from './Do';
import RedoRequest from './Redo';
export default class UndoRequest {
    user: number;
    vector: Vector;
    /**
     * Represents an undo request made by an user at a certain time
     * @param user
     * @param vector The time at which the request was issued
     */
    constructor(user: number, vector: Vector);
    toString(): string;
    toHTML(): string;
    copy(): UndoRequest;
    /**
     * Finds the corresponding DoRequest to this UndoRequest
     * @param log The log to search
     */
    associatedRequest(log: Array<DoRequest | UndoRequest | RedoRequest>): DoRequest;
}
