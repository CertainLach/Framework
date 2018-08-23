import { Operation } from '../Operation';
import SegmentBuffer from '../SegmentBuffer';
export default class Split implements Operation {
    requiresCID: boolean;
    first: Operation;
    second: Operation;
    /**
     * An operation which wraps two different operations into a single object.
     * This is necessary for example in order to transform a Delete operation against
     * an Insert operation which falls into the range that is to be deleted
     * @param first
     * @param second
     */
    constructor(first: Operation, second: Operation);
    toString(): string;
    toHTML(): string;
    /**
     * Applies the two components of this split operation to the given buffer sequentially.
     *  The second component is implicitly transformed against the first one in order to do so.
     * @param buffer The buffer to which this operation is to be applied
     */
    apply(buffer: SegmentBuffer): void;
    cid(): void;
    /**
     * Transforms this Split operation against another operation.
     * This is done by transforming both components individually.
     * @param other
     * @param cid
     */
    transform(other: Operation, cid?: Operation): Operation;
    /**
     * Mirrors this Split operation. This is done by transforming the second component
     * against the first one, then mirroring both components individually
     */
    mirror(): Split;
}
