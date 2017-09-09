(function (dependencies, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    }
})(["require", "exports"], function (require, exports) {
    "use strict";
    var ReconSegment = (function () {
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
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = ReconSegment;
});
//# sourceMappingURL=ReconSegment.js.map