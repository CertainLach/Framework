import SegmentBuffer from './SegmentBuffer';
export interface Operation {
    requiresCID: boolean;
    position?: number;
    toString(): String;
    toHTML(): String;
    apply(buffer: SegmentBuffer): void;
    transform(other: Operation, cid?: Operation): Operation;
    mirror(): Operation;
}
