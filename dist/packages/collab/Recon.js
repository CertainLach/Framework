"use strict";
const SegmentBuffer_1 = require("./SegmentBuffer");
const ReconSegment_1 = require("./ReconSegment");
class Recon {
    constructor(recon) {
        if (recon)
            this.segments = recon.segments.slice(0);
        else
            this.segments = new Array();
    }
    toString() {
        return `Recon(${this.segments})`;
    }
    update(offset, buffer) {
        const newRecon = new Recon(this);
        if (buffer instanceof SegmentBuffer_1.default)
            newRecon.segments.push(new ReconSegment_1.default(offset, buffer));
        return newRecon;
    }
    restore(buffer) {
        for (const index in this.segments) {
            const segment = this.segments[index];
            buffer.splice(segment.offset, 0, segment.buffer);
        }
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Recon;
//# sourceMappingURL=Recon.js.map