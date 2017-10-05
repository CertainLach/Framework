import SegmentBuffer from "./SegmentBuffer";
export default class ReconSegment {
    buffer: SegmentBuffer;
    offset: number;
    constructor(offset: number, buffer: SegmentBuffer);
    toString(): string;
}
