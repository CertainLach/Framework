"use strict";
const SegmentBuffer_1 = require("./SegmentBuffer");
const Vector_1 = require("./Vector");
const Do_1 = require("./requests/Do");
const Undo_1 = require("./requests/Undo");
const Redo_1 = require("./requests/Redo");
const Delete_1 = require("./operations/Delete");
class State {
    constructor(buffer = new SegmentBuffer_1.default(), vector) {
        this.buffer = buffer.copy();
        this.vector = new Vector_1.default(vector);
        this.request_queue = new Array();
        this.log = new Array();
        this.cache = {};
    }
    translate(request, targetVector, noCache = false) {
        if (request instanceof Do_1.default && request.vector.equals(targetVector)) {
            return request.copy();
        }
        const cache_key = [request, targetVector].toString();
        if (this.cache != undefined && !noCache) {
            if (!this.cache[cache_key])
                this.cache[cache_key] = this.translate(request, targetVector, true);
            return this.cache[cache_key];
        }
        if (request instanceof Undo_1.default || request instanceof Redo_1.default) {
            const assocReq = request.associatedRequest(this.log);
            const mirrorAt = targetVector.copy();
            mirrorAt[request.user] = assocReq.vector.get(request.user);
            if (this.reachable(mirrorAt)) {
                let translated = this.translate(assocReq, mirrorAt);
                const mirrorBy = targetVector.get(request.user) -
                    mirrorAt.get(request.user);
                const mirrored = translated.mirror(mirrorBy);
                return mirrored;
            }
        }
        for (const _user in this.vector) {
            if (!_user.match(Vector_1.default.user_regex))
                continue;
            const user = parseInt(_user);
            if (user == request.user)
                continue;
            if (targetVector.get(user) <= request.vector.get(user))
                continue;
            let lastRequest = this.requestByUser(user, targetVector.get(user) - 1);
            if (lastRequest instanceof Undo_1.default || lastRequest instanceof Redo_1.default) {
                const foldBy = targetVector.get(user) -
                    lastRequest.associatedRequest(this.log).vector.get(user);
                if (targetVector.get(user) >= foldBy) {
                    const foldAt = targetVector.incr(user, -foldBy);
                    if (this.reachable(foldAt) && request.vector.causallyBefore(foldAt)) {
                        let translated = this.translate(request, foldAt);
                        const folded = translated.fold(user, foldBy);
                        return folded;
                    }
                }
            }
            const transformAt = targetVector.incr(user, -1);
            if (transformAt.get(user) >= 0 && this.reachable(transformAt)) {
                lastRequest = this.requestByUser(user, transformAt.get(user));
                const r1 = this.translate(request, transformAt);
                const r2 = this.translate(lastRequest, transformAt);
                let cid_req;
                if (r1.operation.requiresCID) {
                    let cid = r1.operation.cid(r2.operation);
                    if (!cid) {
                        const lcs = Vector_1.default.leastCommonSuccessor(request.vector, lastRequest.vector);
                        if (this.reachable(lcs)) {
                            const r1t = this.translate(request, lcs);
                            const r2t = this.translate(lastRequest, lcs);
                            const cidt = r1t.operation.cid(r2t.operation);
                            if (cidt == r1t.operation)
                                cid = r1.operation;
                            else if (cidt == r2t.operation)
                                cid = r2.operation;
                        }
                        if (!cid) {
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
    queue(request) {
        this.request_queue.push(request);
    }
    canExecute(request) {
        if (request == undefined)
            return false;
        if (request instanceof Undo_1.default || request instanceof Redo_1.default) {
            return request.associatedRequest(this.log) != undefined;
        }
        else {
            return request.vector.causallyBefore(this.vector);
        }
    }
    execute(request) {
        if (request == undefined) {
            for (let index = 0; index < this.request_queue.length; index++) {
                request = this.request_queue[index];
                if (this.canExecute(request)) {
                    this.request_queue.splice(index, 1);
                    break;
                }
            }
        }
        if (!this.canExecute(request)) {
            if (request != undefined)
                this.queue(request);
            return;
        }
        if (request.vector.get(request.user) < this.vector.get(request.user)) {
            this.log.push(request);
            return;
        }
        request = request.copy();
        if (request instanceof Undo_1.default || request instanceof Redo_1.default) {
            const assocReq = request.associatedRequest(this.log);
            const newVector = new Vector_1.default(assocReq.vector);
            newVector[request.user] = request.vector.get(request.user);
            request.vector = newVector;
        }
        const translated = this.translate(request, this.vector);
        if (request instanceof Do_1.default && request.operation instanceof Delete_1.default) {
            this.log.push(request.makeReversible(translated, this));
        }
        else {
            this.log.push(request);
        }
        translated.execute(this);
        if (this.onexecute)
            this.onexecute(translated);
        return translated;
    }
    executeAll() {
        let executed;
        do {
            executed = this.execute();
        } while (executed);
    }
    reachable(vector) {
        return this.vector.eachUser(user => this.reachableUser(vector, user));
    }
    reachableUser(vector, user) {
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
            if (r instanceof Do_1.default) {
                const w = r.vector;
                return w.incr(r.user).causallyBefore(vector);
            }
            else {
                const assocReq = r.associatedRequest(this.log);
                n = assocReq.vector.get(user);
            }
        }
    }
    requestByUser(user, getIndex) {
        for (const reqIndex in this.log) {
            const request = this.log[reqIndex];
            if (request.user == user && request.vector.get(user) == getIndex) {
                return request;
            }
        }
    }
    firstRequestByUser(user) {
        let firstRequest;
        for (const reqIndex in this.log) {
            const request = this.log[reqIndex];
            if (request.user == user && (!firstRequest || firstRequest.vector.get(user) > request.vector.get(user))) {
                firstRequest = request;
            }
        }
        return firstRequest;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = State;
//# sourceMappingURL=State.js.map