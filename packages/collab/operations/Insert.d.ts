import { Operation } from '../Operation';
import SegmentBuffer from "../SegmentBuffer";
import Delete from "./Delete";
export default class Insert implements Operation {
    requiresCID: boolean;
    text: SegmentBuffer;
    position: number;
    /**
     * An operation that inserts a SegmentBuffer at a certain offset.
     * @param position The offset at which the text is to be inserted
     * @param text The SegmentBuffer to insert
     */
    constructor(position: number, text: SegmentBuffer);
    toString(): string;
    toHTML(): string;
    /**
     * Applies the insert operation to the given SegmentBuffer
     * @param buffer The buffer in which the insert operation is to be performed.
     */
    apply(buffer: SegmentBuffer): void;
    /**
     * Computes the concurrency ID against another Insert operation
     * @param other
     */
    cid(other: Insert): Insert;
    /**
     * Returns the total length of data to be inserted by this insert operation, in characters.
     */
    getLength(): number;
    /**
     * Transforms this Insert operation against another operation, returning the resulting operation as a new object.
     * @param other The operation to transform against
     * @param cid The cid to take into account in the case of conflicts
     */
    transform(other: Operation, cid?: Operation): Operation;
    /**
     * Returns the inversion of this Insert operation
     */
    mirror(): Delete;
}
