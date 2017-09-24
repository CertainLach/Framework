import { Operation } from '../Operation';
import SegmentBuffer from '../SegmentBuffer';
export default class NoOp implements Operation {
    requiresCID: boolean;
    constructor();
    toString(): string;
    apply(buffer: SegmentBuffer): void;
    transform(other: Operation): NoOp;
    mirror(): NoOp;
    toHTML(): String;
}
