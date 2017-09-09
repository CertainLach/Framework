(function (dependencies, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    }
})(["require", "exports", "./SegmentBuffer", "./ReconSegment"], function (require, exports) {
    "use strict";
    var SegmentBuffer_1 = require("./SegmentBuffer");
    var ReconSegment_1 = require("./ReconSegment");
    var Recon = (function () {
        /**
         * The Recon class is a helper class which collects the parts of a
         * Delete operation that are lost during transformation. This is used to
         * reconstruct the text of a remote Delete operation that was issued in a
         * previous state, and thus to make such a Delete operation reversible
         * @param recon Pre-initialize the Recon object with data from
         * another object
         */
        function Recon(recon) {
            if (recon)
                this.segments = recon.segments.slice(0);
            else
                this.segments = new Array();
        }
        Recon.prototype.toString = function () {
            return "Recon(" + this.segments + ")";
        };
        /**
         * Creates a new Recon object with an additional piece of text to be restored later
         * @param offset
         * @param buffer
         */
        Recon.prototype.update = function (offset, buffer) {
            var newRecon = new Recon(this);
            if (buffer instanceof SegmentBuffer_1.default)
                newRecon.segments.push(new ReconSegment_1.default(offset, buffer));
            return newRecon;
        };
        /**
         * Restores the recon data in the given buffer
         * @param buffer
         */
        Recon.prototype.restore = function (buffer) {
            for (var index in this.segments) {
                var segment = this.segments[index];
                buffer.splice(segment.offset, 0, segment.buffer);
            }
        };
        return Recon;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Recon;
});
//# sourceMappingURL=Recon.js.map