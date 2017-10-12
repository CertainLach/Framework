var NoOp = /** @class */ (function () {
    /**
     * An operation that does nothing
     */
    function NoOp() {
        this.requiresCID = false;
    }
    NoOp.prototype.toString = function () {
        return "NoOp()";
    };
    /**
     * Applies this NoOp operation to a buffer. This does nothing, per definition
     */
    NoOp.prototype.apply = function (buffer) {
    };
    /**
     * Transforms this NoOp operation against another operation. This returns a new NoOp operation
     */
    NoOp.prototype.transform = function (other) {
        return new NoOp();
    };
    /**
     * Mirrors this NoOp operation. This returns a new NoOp operation
     */
    NoOp.prototype.mirror = function () {
        return new NoOp();
    };
    NoOp.prototype.toHTML = function () {
        return this.toString();
    };
    return NoOp;
}());
export default NoOp;
//# sourceMappingURL=NoOp.js.map