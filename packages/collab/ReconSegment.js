var ReconSegment = /** @class */ (function () {
    /**
     * ReconSegments store a range of text combined with the offset at
     * which they are to be inserted upon restoration
     * @param offset
     * @param buffer
     */
    function ReconSegment(offset, buffer) {
        this.offset = offset;
        this.buffer = buffer.copy();
    }
    ReconSegment.prototype.toString = function () {
        return "(" + this.offset + ", " + this.buffer + ")";
    };
    return ReconSegment;
}());
export default ReconSegment;
//# sourceMappingURL=ReconSegment.js.map