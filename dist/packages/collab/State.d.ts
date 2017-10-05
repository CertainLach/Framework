import SegmentBuffer from './SegmentBuffer';
import Vector from './Vector';
import DoRequest from './requests/Do';
import UndoRequest from './requests/Undo';
import RedoRequest from './requests/Redo';
import Request from './Request';
export default class State {
    buffer: SegmentBuffer;
    vector: Vector;
    request_queue: Array<Request>;
    log: Array<Request>;
    cache: any;
    user: number;
    constructor(buffer: SegmentBuffer, vector: Vector);
    translate(request: any, targetVector: any, noCache?: boolean): any;
    queue(request: Request): void;
    canExecute(request: Request): boolean;
    execute(request?: Request): Request | undefined;
    executeAll(): void;
    reachable(vector: Vector): boolean;
    reachableUser(vector: Vector, user: number): boolean;
    requestByUser(user: number, getIndex: number): DoRequest | RedoRequest | UndoRequest;
    firstRequestByUser(user: number): any;
}
