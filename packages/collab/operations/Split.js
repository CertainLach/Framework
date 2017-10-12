var Split = /** @class */ (function () {
    /**
     * An operation which wraps two different operations into a single object.
     * This is necessary for example in order to transform a Delete operation against
     * an Insert operation which falls into the range that is to be deleted
     * @param first
     * @param second
     */
    function Split(first, second) {
        this.requiresCID = true;
        this.first = first;
        this.second = second;
    }
    Split.prototype.toString = function () {
        return "Split(" + this.first + ", " + this.second + ")";
    };
    Split.prototype.toHTML = function () {
        return "Split(" + this.first.toHTML() + ", " + this.second.toHTML() + ")";
    };
    /**
     * Applies the two components of this split operation to the given buffer sequentially.
     *  The second component is implicitly transformed against the first one in order to do so.
     * @param buffer The buffer to which this operation is to be applied
     */
    Split.prototype.apply = function (buffer) {
        this.first.apply(buffer);
        var transformedSecond = this.second.transform(this.first);
        transformedSecond.apply(buffer);
    };
    Split.prototype.cid = function () {
    };
    /**
     * Transforms this Split operation against another operation.
     * This is done by transforming both components individually.
     * @param other
     * @param cid
     */
    Split.prototype.transform = function (other, cid) {
        if (cid === this || cid == other)
            return new Split(this.first.transform(other, (cid === this ? this.first : other)), this.second.transform(other, (cid === this ? this.second : other)));
        else
            return new Split(this.first.transform(other), this.second.transform(other));
    };
    /**
     * Mirrors this Split operation. This is done by transforming the second component
     * against the first one, then mirroring both components individually
     */
    Split.prototype.mirror = function () {
        var newSecond = this.second.transform(this.first);
        return new Split(this.first.mirror(), newSecond.mirror());
    };
    return Split;
}());
export default Split;
//# sourceMappingURL=Split.js.map