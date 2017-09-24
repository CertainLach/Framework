import Vector from '../Vector';
import DoRequest from './Do';
import UndoRequest from './Undo';
export default class RedoRequest {
    user: number;
    vector: Vector;
    constructor(user: number, vector: Vector);
    toString(): string;
    toHTML(): string;
    copy(): RedoRequest;
    associatedRequest(log: Array<DoRequest | UndoRequest | RedoRequest>): UndoRequest;
}
