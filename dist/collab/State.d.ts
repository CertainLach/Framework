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
    /**
     * Stores and manipulates the state of a document by keeping track of
     * its state vector, content and history of executed requests
     * @param buffer Pre-initialize the buffer
     * @param vector Set the initial state vector
     */
    constructor(buffer: SegmentBuffer, vector: Vector);
    /**
     * Translates a request to the given state vector
     * @param request The request to translate
     * @param targetVector The target state vector
     * @param noCache Set to true to bypass the translation cache
     */
    translate(request: any, targetVector: any, noCache?: boolean): any;
    /**
     * Adds a request to the request queue
     * @param request The request to be queued
     */
    queue(request: Request): void;
    /**
     * Checks whether a given request can be executed in the current state
     * @param request
     */
    canExecute(request: Request): boolean;
    /**
     * Executes a request that is executable
     * @param request The request to be executed. If omitted, an
     * executable request is picked from the request queue instead
     */
    execute(request?: Request): Request | undefined;
    /**
     * Executes all queued requests that are ready for execution
     */
    executeAll(): void;
    /**
     * Determines whether a given state is reachable by translation
     * @param vector
     */
    reachable(vector: Vector): boolean;
    reachableUser(vector: Vector, user: number): boolean;
    /**
     * Retrieve an user's request by its index
     * @param user
     * @param getIndex
     */
    requestByUser(user: number, getIndex: number): DoRequest | RedoRequest | UndoRequest;
    /**
     * Retrieve the first request in the log that was issued by the given user
     * @param user
     */
    firstRequestByUser(user: number): any;
}
