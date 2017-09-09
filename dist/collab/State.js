(function (dependencies, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    }
})(["require", "exports", "./SegmentBuffer", "./Vector", "./requests/Do", "./requests/Undo", "./requests/Redo", "./operations/Delete"], function (require, exports) {
    "use strict";
    var SegmentBuffer_1 = require("./SegmentBuffer");
    var Vector_1 = require("./Vector");
    var Do_1 = require("./requests/Do");
    var Undo_1 = require("./requests/Undo");
    var Redo_1 = require("./requests/Redo");
    var Delete_1 = require("./operations/Delete");
    var State = (function () {
        /**
         * Stores and manipulates the state of a document by keeping track of
         * its state vector, content and history of executed requests
         * @param buffer Pre-initialize the buffer
         * @param vector Set the initial state vector
         */
        function State(buffer, vector) {
            if (buffer === void 0) { buffer = new SegmentBuffer_1.default(); }
            this.buffer = buffer.copy();
            this.vector = new Vector_1.default(vector);
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
        State.prototype.translate = function (request, targetVector, noCache) {
            if (noCache === void 0) { noCache = false; }
            if (request instanceof Do_1.default && request.vector.equals(targetVector)) {
                // If the request vector is not an undo/redo request and is already
                // at the desired state, simply return the original request since
                // there is nothing to do.
                return request.copy();
            }
            // Before we attempt to translate the request, we check whether it is
            // cached already.
            var cache_key = [request, targetVector].toString();
            if (this.cache != undefined && !noCache) {
                if (!this.cache[cache_key])
                    this.cache[cache_key] = this.translate(request, targetVector, true);
                // FIXME: translated requests are not cleared from the cache, so this
                // might fill up considerably.
                return this.cache[cache_key];
            }
            if (request instanceof Undo_1.default || request instanceof Redo_1.default) {
                // If we're dealing with an undo or redo request, we first try to see
                // whether a late mirror is possible. For this, we retrieve the
                // associated request to this undo/redo and see whether it can be
                // translated and then mirrored to the desired state.
                var assocReq = request.associatedRequest(this.log);
                // The state we're trying to mirror at corresponds to the target
                // vector, except the component of the issuing user is changed to
                // match the one from the associated request.
                var mirrorAt = targetVector.copy();
                mirrorAt[request.user] = assocReq.vector.get(request.user);
                if (this.reachable(mirrorAt)) {
                    var translated = this.translate(assocReq, mirrorAt);
                    var mirrorBy = targetVector.get(request.user) -
                        mirrorAt.get(request.user);
                    var mirrored = translated.mirror(mirrorBy);
                    return mirrored;
                }
            }
            for (var _user in this.vector) {
                // We now iterate through all users to see how we can translate
                // the request to the desired state.
                if (!_user.match(Vector_1.default.user_regex))
                    continue;
                var user = parseInt(_user);
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
                var lastRequest = this.requestByUser(user, targetVector.get(user) - 1);
                if (lastRequest instanceof Undo_1.default || lastRequest instanceof Redo_1.default) {
                    // When the last request was an undo/redo request, we can try to
                    // "fold" over it. By just skipping the do/undo or undo/redo pair,
                    // we pretend that nothing has changed and increase the state
                    // vector.
                    var foldBy = targetVector.get(user) -
                        lastRequest.associatedRequest(this.log).vector.get(user);
                    if (targetVector.get(user) >= foldBy) {
                        var foldAt = targetVector.incr(user, -foldBy);
                        // We need to make sure that the state we're trying to
                        // fold at is reachable and that the request we're translating
                        // was issued before it.
                        if (this.reachable(foldAt) && request.vector.causallyBefore(foldAt)) {
                            var translated = this.translate(request, foldAt);
                            var folded = translated.fold(user, foldBy);
                            return folded;
                        }
                    }
                }
                // If folding and mirroring is not possible, we can transform this
                // request against other users' requests that have contributed to
                // the current state vector.
                var transformAt = targetVector.incr(user, -1);
                if (transformAt.get(user) >= 0 && this.reachable(transformAt)) {
                    lastRequest = this.requestByUser(user, transformAt.get(user));
                    var r1 = this.translate(request, transformAt);
                    var r2 = this.translate(lastRequest, transformAt);
                    var cid_req = void 0;
                    if (r1.operation.requiresCID) {
                        // For the Insert operation, we need to check whether it is
                        // possible to determine which operation is to be transformed.
                        var cid = r1.operation.cid(r2.operation);
                        if (!cid) {
                            // When two requests insert text at the same position,
                            // the transformation result is undefined. We therefore
                            // need to perform some tricks to decide which request
                            // has to be transformed against which.
                            // The first try is to transform both requests to a
                            // common successor before the transformation vector.
                            var lcs = Vector_1.default.leastCommonSuccessor(request.vector, lastRequest.vector);
                            if (this.reachable(lcs)) {
                                var r1t = this.translate(request, lcs);
                                var r2t = this.translate(lastRequest, lcs);
                                // We try to determine the CID at this vector, which
                                // hopefully yields a result.
                                var cidt = r1t.operation.cid(r2t.operation);
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
        };
        /**
         * Adds a request to the request queue
         * @param request The request to be queued
         */
        State.prototype.queue = function (request) {
            this.request_queue.push(request);
        };
        /**
         * Checks whether a given request can be executed in the current state
         * @param request
         */
        State.prototype.canExecute = function (request) {
            if (request == undefined)
                return false;
            if (request instanceof Undo_1.default || request instanceof Redo_1.default) {
                return request.associatedRequest(this.log) != undefined;
            }
            else {
                return request.vector.causallyBefore(this.vector);
            }
        };
        /**
         * Executes a request that is executable
         * @param request The request to be executed. If omitted, an
         * executable request is picked from the request queue instead
         */
        State.prototype.execute = function (request) {
            if (request == undefined) {
                // Pick an executable request from the queue.
                for (var index = 0; index < this.request_queue.length; index++) {
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
            if (request instanceof Undo_1.default || request instanceof Redo_1.default) {
                // For undo and redo requests, we change their vector to the vector
                // of the original request, but leave the issuing user's component
                // untouched.
                var assocReq = request.associatedRequest(this.log);
                var newVector = new Vector_1.default(assocReq.vector);
                newVector[request.user] = request.vector.get(request.user);
                request.vector = newVector;
            }
            var translated = this.translate(request, this.vector);
            if (request instanceof Do_1.default && request.operation instanceof Delete_1.default) {
                // Since each request might have to be mirrored at some point, it
                // needs to be reversible. Delete requests are not reversible by
                // default, but we can make them reversible.
                this.log.push(request.makeReversible(translated, this));
            }
            else {
                this.log.push(request);
            }
            translated.execute(this);
            if (this.onexecute)
                this.onexecute(translated);
            return translated;
        };
        /**
         * Executes all queued requests that are ready for execution
         */
        State.prototype.executeAll = function () {
            var executed;
            do {
                executed = this.execute();
            } while (executed);
        };
        /**
         * Determines whether a given state is reachable by translation
         * @param vector
         */
        State.prototype.reachable = function (vector) {
            var _this = this;
            return this.vector.eachUser(function (user) { return _this.reachableUser(vector, user); });
        };
        State.prototype.reachableUser = function (vector, user) {
            var n = vector.get(user);
            var firstRequest = this.firstRequestByUser(user);
            var firstRequestnumber = firstRequest ? firstRequest.vector.get(user) :
                this.vector.get(user);
            while (true) {
                if (n == firstRequestnumber)
                    return true;
                var r = this.requestByUser(user, n - 1);
                if (r == undefined) {
                    return false;
                }
                if (r instanceof Do_1.default) {
                    var w = r.vector;
                    return w.incr(r.user).causallyBefore(vector);
                }
                else {
                    var assocReq = r.associatedRequest(this.log);
                    n = assocReq.vector.get(user);
                }
            }
        };
        /**
         * Retrieve an user's request by its index
         * @param user
         * @param getIndex
         */
        State.prototype.requestByUser = function (user, getIndex) {
            for (var reqIndex in this.log) {
                var request = this.log[reqIndex];
                if (request.user == user && request.vector.get(user) == getIndex) {
                    return request;
                }
            }
        };
        /**
         * Retrieve the first request in the log that was issued by the given user
         * @param user
         */
        State.prototype.firstRequestByUser = function (user) {
            var firstRequest;
            for (var reqIndex in this.log) {
                var request = this.log[reqIndex];
                if (request.user == user && (!firstRequest || firstRequest.vector.get(user) > request.vector.get(user))) {
                    firstRequest = request;
                }
            }
            return firstRequest;
        };
        return State;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = State;
});
//# sourceMappingURL=State.js.map