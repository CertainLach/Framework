import SegmentBuffer from "./SegmentBuffer";

/** Instantiates a new ReconSegment object.
 *  @class ReconSegments store a range of text combined with the offset at
 *  which they are to be inserted upon restoration.
 *  @param {number} offset
 *  @param {SegmentBuffer} buffer
 */
export default class ReconSegment {
    buffer: SegmentBuffer;
    offset: number;

    constructor(offset: number, buffer: SegmentBuffer) {
        this.offset = offset;
        this.buffer = buffer.copy();
    }

    toString() {
        return `(${this.offset}, ${this.buffer})`;
    }
}