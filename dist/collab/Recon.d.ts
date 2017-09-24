import SegmentBuffer from "./SegmentBuffer";
import ReconSegment from "./ReconSegment";
export default class Recon {
    segments: Array<ReconSegment>;
    constructor(recon?: Recon);
    toString(): string;
    update(offset: number, buffer: SegmentBuffer): Recon;
    restore(buffer: SegmentBuffer): void;
}
