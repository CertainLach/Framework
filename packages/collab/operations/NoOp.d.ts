import { Operation } from '../Operation';
import SegmentBuffer from '../SegmentBuffer';
export default class NoOp implements Operation {
    requiresCID: boolean;
    /**
     * An operation that does nothing
     */
    constructor();
    toString(): string;
    /**
     * Applies this NoOp operation to a buffer. This does nothing, per definition
     */
    apply(buffer: SegmentBuffer): void;
    /**
     * Transforms this NoOp operation against another operation. This returns a new NoOp operation
     */
    transform(other: Operation): NoOp;
    /**
     * Mirrors this NoOp operation. This returns a new NoOp operation
     */
    mirror(): NoOp;
    toHTML(): String;
}
