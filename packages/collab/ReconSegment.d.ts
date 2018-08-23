import SegmentBuffer from "./SegmentBuffer";
export default class ReconSegment {
    buffer: SegmentBuffer;
    offset: number;
    /**
     * ReconSegments store a range of text combined with the offset at
     * which they are to be inserted upon restoration
     * @param offset
     * @param buffer
     */
    constructor(offset: number, buffer: SegmentBuffer);
    toString(): string;
}
