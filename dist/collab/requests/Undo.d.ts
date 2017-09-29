import Vector from '../Vector';
import DoRequest from './Do';
import RedoRequest from './Redo';
export default class UndoRequest {
    user: number;
    vector: Vector;
    constructor(user: number, vector: Vector);
    toString(): string;
    toHTML(): string;
    copy(): UndoRequest;
    associatedRequest(log: Array<DoRequest | UndoRequest | RedoRequest>): DoRequest;
}
