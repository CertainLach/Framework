"use strict";
class ReconSegment {
    constructor(offset, buffer) {
        this.offset = offset;
        this.buffer = buffer.copy();
    }
    toString() {
        return `(${this.offset}, ${this.buffer})`;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ReconSegment;
//# sourceMappingURL=ReconSegment.js.map