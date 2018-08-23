import { Operation } from '../Operation';
import SegmentBuffer from "../SegmentBuffer";
import Split from "./Split";
import Insert from "./Insert";
import Recon from "../Recon";
import State from "../State";
export default class Delete implements Operation {
    requiresCID: boolean;
    position: number;
    recon: Recon;
    what: SegmentBuffer | number;
    /**
     * Instantiates a new Delete operation object.
     * Delete operations can be reversible or not, depending on how they are
     * constructed. Delete operations constructed with a SegmentBuffer object know which
     * text they are removing from the buffer and can therefore be mirrored,
     * whereas Delete operations knowing only the amount of characters to be
     * removed are non-reversible.
     * Delete - an operation that removes a range of characters in the target buffer.
     * @param position The offset of the first character to remove
     * @param what The data to be removed
     * @param recon
     */
    constructor(position: number, what: number | SegmentBuffer, recon?: Recon);
    toString(): string;
    toHTML(): string;
    /**
     * Determines whether this Delete operation is reversible.
     */
    isReversible(): boolean;
    /**
     * Applies this Delete operation to a buffer.
     * @param buffer The buffer to which the operation is to be applied.
     */
    apply(buffer: SegmentBuffer): void;
    cid(other: Delete): void;
    /**
     * Returns the number of characters that this Delete operation removes.
     */
    getLength(): number;
    /**
     * Splits this Delete operation into two Delete operations at the given
     * offset. The resulting Split operation will consist of two Delete
     * operations which, when combined, affect the same range of text as the
     * original Delete operation.
     * @param at Offset at which to split the Delete operation.
     */
    split(at: number): Split;
    /**
     * Returns the range of text in a buffer that this Delete or Split-Delete
     * operation removes.
     * @param operation A Split-Delete or Delete operation
     * @param buffer
     */
    static getAffectedString(operation: Operation, buffer: SegmentBuffer): SegmentBuffer;
    /**
     * Makes this Delete operation reversible, given a transformed version of
     * this operation in a buffer matching its state. If this Delete operation is
     * already reversible, this function simply returns a copy of it.
     * @param transformed A transformed version of this operation.
     * @param state The state in which the transformed operation could be applied.
     */
    makeReversible(transformed: Operation, state: State): Delete;
    /**
     * Merges a Delete operation with another one. The resulting Delete operation
     * removes the same range of text as the two separate Delete operations would
     * when executed sequentially.
     * @param other
     */
    merge(other: Delete): Delete;
    /**
     * Transforms this Delete operation against another operation
     * @param other
     * @param cid
     */
    transform(other: Operation, cid?: Operation): Operation;
    /**
     * Mirrors this Delete operation. Returns an operation which inserts the text
     * that this Delete operation would remove. If this Delete operation is not
     * reversible, the return value is undefined.
     */
    mirror(): Insert;
}
