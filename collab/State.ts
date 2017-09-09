import SegmentBuffer from './SegmentBuffer';
import Vector from './Vector';
import DoRequest from './requests/Do';
import UndoRequest from './requests/Undo';
import RedoRequest from './requests/Redo';
import Delete from './operations/Delete';
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
    constructor(buffer: SegmentBuffer = new SegmentBuffer(), vector: Vector) {
        this.buffer = buffer.copy();

        this.vector = new Vector(vector);
        this.request_queue = new Array();
        this.log = new Array();
        this.cache = {};
    }

    /**
     * Translates a request to the given state vector
     * @param request The request to translate
     * @param targetVector The target state vector
     * @param noCache Set to true to bypass the translation cache
     */
    translate(request, targetVector, noCache = false) {
        if (request instanceof DoRequest && request.vector.equals(targetVector)) {
            // If the request vector is not an undo/redo request and is already
            // at the desired state, simply return the original request since
            // there is nothing to do.
            return request.copy();
        }

        // Before we attempt to translate the request, we check whether it is
        // cached already.
        const cache_key = [request, targetVector].toString();
        if (this.cache != undefined && !noCache) {
            if (!this.cache[cache_key])
                this.cache[cache_key] = this.translate(request, targetVector, true);

            // FIXME: translated requests are not cleared from the cache, so this
            // might fill up considerably.
            return this.cache[cache_key];
        }

        if (request instanceof UndoRequest || request instanceof RedoRequest) {
            // If we're dealing with an undo or redo request, we first try to see
            // whether a late mirror is possible. For this, we retrieve the
            // associated request to this undo/redo and see whether it can be
            // translated and then mirrored to the desired state.
            const assocReq = request.associatedRequest(this.log);

            // The state we're trying to mirror at corresponds to the target
            // vector, except the component of the issuing user is changed to
            // match the one from the associated request.
            const mirrorAt = targetVector.copy();
            mirrorAt[request.user] = assocReq.vector.get(request.user);

            if (this.reachable(mirrorAt)) {
                let translated = this.translate(assocReq, mirrorAt);
                const mirrorBy = targetVector.get(request.user) -
                    mirrorAt.get(request.user);

                const mirrored = translated.mirror(mirrorBy);
                return mirrored;
            }

            // If mirrorAt is not reachable, we need to mirror earlier and then
            // perform a translation afterwards, which is attempted next.
        }

        for (const _user in this.vector) {
            // We now iterate through all users to see how we can translate
            // the request to the desired state.

            if (!_user.match(Vector.user_regex))
                continue;

            const user = parseInt(_user);

            // The request's issuing user is left out since it is not possible
            // to transform or fold a request along its own user.
            if (user == request.user)
                continue;

            // We can only transform against requests that have been issued
            // between the translated request's vector and the target vector.
            if (targetVector.get(user) <= request.vector.get(user))
                continue;

            // Fetch the last request by this user that contributed to the
            // current state vector.
            let lastRequest = this.requestByUser(user, targetVector.get(user) - 1);

            if (lastRequest instanceof UndoRequest || lastRequest instanceof RedoRequest) {
                // When the last request was an undo/redo request, we can try to
                // "fold" over it. By just skipping the do/undo or undo/redo pair,
                // we pretend that nothing has changed and increase the state
                // vector.

                const foldBy = targetVector.get(user) -
                    lastRequest.associatedRequest(this.log).vector.get(user);

                if (targetVector.get(user) >= foldBy) {
                    const foldAt = targetVector.incr(user, -foldBy);

                    // We need to make sure that the state we're trying to
                    // fold at is reachable and that the request we're translating
                    // was issued before it.

                    if (this.reachable(foldAt) && request.vector.causallyBefore(foldAt)) {
                        let translated = this.translate(request, foldAt);
                        const folded = translated.fold(user, foldBy);

                        return folded;
                    }
                }
            }

            // If folding and mirroring is not possible, we can transform this
            // request against other users' requests that have contributed to
            // the current state vector.

            const transformAt = targetVector.incr(user, -1);
            if (transformAt.get(user) >= 0 && this.reachable(transformAt)) {
                lastRequest = this.requestByUser(user, transformAt.get(user));

                const r1 = this.translate(request, transformAt);
                const r2 = this.translate(lastRequest, transformAt);

                let cid_req;

                if (r1.operation.requiresCID) {
                    // For the Insert operation, we need to check whether it is
                    // possible to determine which operation is to be transformed.
                    let cid = r1.operation.cid(r2.operation);

                    if (!cid) {
                        // When two requests insert text at the same position,
                        // the transformation result is undefined. We therefore
                        // need to perform some tricks to decide which request
                        // has to be transformed against which.

                        // The first try is to transform both requests to a
                        // common successor before the transformation vector.
                        const lcs = Vector.leastCommonSuccessor(request.vector,
                            lastRequest.vector);

                        if (this.reachable(lcs)) {
                            const r1t = this.translate(request, lcs);
                            const r2t = this.translate(lastRequest, lcs);

                            // We try to determine the CID at this vector, which
                            // hopefully yields a result.
                            const cidt = r1t.operation.cid(r2t.operation);

                            if (cidt == r1t.operation)
                                cid = r1.operation;
                            else if (cidt == r2t.operation)
                                cid = r2.operation;
                        }

                        if (!cid) {
                            // If we arrived here, we couldn't decide for a CID,
                            // so we take the last resort: use the user ID of the
                            // requests to decide which request is to be
                            // transformed. This behavior is specified in the
                            // Infinote protocol.

                            if (r1.user < r2.user)
                                cid = r1.operation;
                            if (r1.user > r2.user)
                                cid = r2.operation;
                        }
                    }

                    if (cid == r1.operation)
                        cid_req = r1;
                    if (cid == r2.operation)
                        cid_req = r2;
                }

                return r1.transform(r2, cid_req);
            }
        }

        throw new Error("Could not find a translation path");
    }

    /**
     * Adds a request to the request queue
     * @param request The request to be queued
     */
    queue(request: Request) {
        this.request_queue.push(request);
    }

    /**
     * Checks whether a given request can be executed in the current state
     * @param request 
     */
    canExecute(request: Request): boolean {
        if (request == undefined)
            return false;

        if (request instanceof UndoRequest || request instanceof RedoRequest) {
            return request.associatedRequest(this.log) != undefined;
        } else {
            return request.vector.causallyBefore(this.vector);
        }
    }

    /**
     * Executes a request that is executable
     * @param request The request to be executed. If omitted, an
     * executable request is picked from the request queue instead
     */
    execute(request?: Request): Request|undefined {
        if (request == undefined) {
            // Pick an executable request from the queue.
            for (let index = 0; index < this.request_queue.length; index++) {
                request = this.request_queue[index];
                if (this.canExecute(request)) {
                    this.request_queue.splice(index, 1);
                    break;
                }
            }
        }

        if (!this.canExecute(request)) {
            // Not executable yet - put it (back) in the queue.
            if (request != undefined)
                this.queue(request);

            return;
        }

        if (request.vector.get(request.user) < this.vector.get(request.user)) {
            // If the request has already been executed, skip it, but record it into the
            // log.
            // FIXME: this assumes the received request is already reversible
            this.log.push(request);
            return;
        }

        request = request.copy();

        if (request instanceof UndoRequest || request instanceof RedoRequest) {
            // For undo and redo requests, we change their vector to the vector
            // of the original request, but leave the issuing user's component
            // untouched.
            const assocReq = request.associatedRequest(this.log);
            const newVector = new Vector(assocReq.vector);
            newVector[request.user] = request.vector.get(request.user);
            request.vector = newVector;
        }

        const translated = this.translate(request, this.vector);

        if (request instanceof DoRequest && request.operation instanceof Delete) {
            // Since each request might have to be mirrored at some point, it
            // needs to be reversible. Delete requests are not reversible by
            // default, but we can make them reversible.
            this.log.push(request.makeReversible(translated, this));
        } else {
            this.log.push(request);
        }

        translated.execute(this);

        if ((<any>this).onexecute)
            (<any>this).onexecute(translated);

        return translated;
    }

    /**
     * Executes all queued requests that are ready for execution
     */
    executeAll() {
        let executed;
        do {
            executed = this.execute();
        } while (executed);
    }

    /**
     * Determines whether a given state is reachable by translation
     * @param vector 
     */
    reachable(vector: Vector): boolean {
        return this.vector.eachUser(user => this.reachableUser(vector, user));
    }

    reachableUser(vector:Vector, user:number):boolean {
        let n = vector.get(user);
        const firstRequest = this.firstRequestByUser(user);
        const firstRequestnumber = firstRequest ? firstRequest.vector.get(user) :
            this.vector.get(user);

        while (true) {
            if (n == firstRequestnumber)
                return true;

            const r = this.requestByUser(user, n - 1);

            if (r == undefined) {
                return false;
            }

            if (r instanceof DoRequest) {
                const w = r.vector;
                return w.incr(r.user).causallyBefore(vector);
            } else {
                const assocReq = (<any>r).associatedRequest(this.log);
                n = assocReq.vector.get(user);
            }
        }
    }

    /**
     * Retrieve an user's request by its index
     * @param user 
     * @param getIndex 
     */
    requestByUser(user: number, getIndex: number) {
        for (const reqIndex in this.log) {
            const request = this.log[reqIndex];

            if (request.user == user && request.vector.get(user) == getIndex) {
                return request;
            }
        }
    }

    /**
     * Retrieve the first request in the log that was issued by the given user
     * @param user 
     */
    firstRequestByUser(user: number) {
        let firstRequest;
        for (const reqIndex in this.log) {
            const request = this.log[reqIndex];

            if (request.user == user && (!firstRequest || firstRequest.vector.get(user) > request.vector.get(user) )) {
                firstRequest = request;
            }
        }

        return firstRequest;
    }
}