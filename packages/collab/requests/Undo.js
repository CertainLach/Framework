var UndoRequest = /** @class */ (function () {
    /**
     * Represents an undo request made by an user at a certain time
     * @param user
     * @param vector The time at which the request was issued
     */
    function UndoRequest(user, vector) {
        this.user = user;
        this.vector = vector;
    }
    UndoRequest.prototype.toString = function () {
        return "UndoRequest(" + [this.user, this.vector].join(", ") + ")";
    };
    UndoRequest.prototype.toHTML = function () {
        return "UndoRequest(" + [this.user, this.vector.toHTML()].join(", ") + ")";
    };
    UndoRequest.prototype.copy = function () {
        return new UndoRequest(this.user, this.vector);
    };
    /**
     * Finds the corresponding DoRequest to this UndoRequest
     * @param log The log to search
     */
    UndoRequest.prototype.associatedRequest = function (log) {
        var sequence = 1;
        var index = log.indexOf(this);
        if (index == -1)
            index = log.length - 1;
        for (; index >= 0; index--) {
            if (log[index] === this || log[index].user != this.user)
                continue;
            if (log[index].vector.get(this.user) > this.vector.get(this.user))
                continue;
            if (log[index] instanceof UndoRequest)
                sequence += 1;
            else
                sequence -= 1;
            if (sequence == 0)
                return log[index];
        }
    };
    return UndoRequest;
}());
export default UndoRequest;
//# sourceMappingURL=Undo.js.map