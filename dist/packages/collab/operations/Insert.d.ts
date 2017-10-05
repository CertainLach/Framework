import { Operation } from '../Operation';
import SegmentBuffer from "../SegmentBuffer";
import Delete from "./Delete";
export default class Insert implements Operation {
    requiresCID: boolean;
    text: SegmentBuffer;
    position: number;
    constructor(position: number, text: SegmentBuffer);
    toString(): string;
    toHTML(): string;
    apply(buffer: SegmentBuffer): void;
    cid(other: Insert): Insert;
    getLength(): number;
    transform(other: Operation, cid?: Operation): Operation;
    mirror(): Delete;
}
