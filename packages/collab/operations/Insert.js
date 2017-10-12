import NoOp from "./NoOp";
import Split from "./Split";
import Delete from "./Delete";
var Insert = /** @class */ (function () {
    /**
     * An operation that inserts a SegmentBuffer at a certain offset.
     * @param position The offset at which the text is to be inserted
     * @param text The SegmentBuffer to insert
     */
    function Insert(position, text) {
        this.requiresCID = true;
        this.position = position;
        this.text = text.copy();
    }
    Insert.prototype.toString = function () {
        return "Insert(" + this.position + ", " + this.text + ")";
    };
    Insert.prototype.toHTML = function () {
        return "Insert(" + this.position + ", " + this.text.toHTML() + ")";
    };
    /**
     * Applies the insert operation to the given SegmentBuffer
     * @param buffer The buffer in which the insert operation is to be performed.
     */
    Insert.prototype.apply = function (buffer) {
        buffer.splice(this.position, 0, this.text);
    };
    /**
     * Computes the concurrency ID against another Insert operation
     * @param other
     */
    Insert.prototype.cid = function (other) {
        if (this.position < other.position)
            return other;
        if (this.position > other.position)
            return this;
    };
    /**
     * Returns the total length of data to be inserted by this insert operation, in characters.
     */
    Insert.prototype.getLength = function () {
        return this.text.getLength();
    };
    /**
     * Transforms this Insert operation against another operation, returning the resulting operation as a new object.
     * @param other The operation to transform against
     * @param cid The cid to take into account in the case of conflicts
     */
    Insert.prototype.transform = function (other, cid) {
        if (other instanceof NoOp)
            return new Insert(this.position, this.text);
        if (other instanceof Split) {
            // We transform against the first component of the split operation first.
            var transformFirst = this.transform(other.first, (cid == this ? this : other.first));
            // The second part of the split operation is transformed against its first part.
            var newSecond = other.second.transform(other.first);
            var transformSecond = transformFirst.transform(newSecond, (cid == this ? transformFirst : newSecond));
            return transformSecond;
        }
        var pos1 = this.position;
        var str1 = this.text;
        var pos2 = other.position;
        if (other instanceof Insert) {
            var str2 = other.text;
            if (pos1 < pos2 || (pos1 == pos2 && cid == other))
                return new Insert(pos1, str1);
            if (pos1 > pos2 || (pos1 == pos2 && cid == this))
                return new Insert(pos1 + str2.getLength(), str1);
        }
        else if (other instanceof Delete) {
            var len2 = other.getLength();
            if (pos1 >= pos2 + len2)
                return new Insert(pos1 - len2, str1);
            if (pos1 < pos2)
                return new Insert(pos1, str1);
            if (pos1 >= pos2 && pos1 < pos2 + len2)
                return new Insert(pos2, str1);
        }
    };
    /**
     * Returns the inversion of this Insert operation
     */
    Insert.prototype.mirror = function () {
        return new Delete(this.position, this.text.copy());
    };
    return Insert;
}());
export default Insert;
//# sourceMappingURL=Insert.js.map