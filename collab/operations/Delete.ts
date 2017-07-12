import Operation from '../Operation';
import SegmentBuffer from "../SegmentBuffer";
import Split from "./Split";
import Recon from "../Recon";

/** Instantiates a new Delete operation object.
 *  Delete operations can be reversible or not, depending on how they are
 *  constructed. Delete operations constructed with a SegmentBuffer object know which
 *  text they are removing from the buffer and can therefore be mirrored,
 *  whereas Delete operations knowing only the amount of characters to be
 *  removed are non-reversible.
 *  @class An operation that removes a range of characters in the target
 *  buffer.
 *  @param position The offset of the first character to remove.
 *  @param what The data to be removed. This can be either a numeric value
 *  or a SegmentBuffer object.
 */
export default class Delete implements Operation {
    requiresCID = false;
    position: number;
    recon: Recon;
    what: SegmentBuffer | number;

    constructor(position: number, what: number | SegmentBuffer, recon: Recon = new Recon()) {
        this.position = position;

        if (what instanceof SegmentBuffer)
            this.what = what.copy();
        else
            this.what = what;

        this.recon = recon;
    }

    toString() {
        return `Delete(${this.position}, ${this.what})`;
    }

    toHTML() {
        return `Delete(${this.position}, ${this.what instanceof SegmentBuffer ? this.what.toHTML() : this.what})`;
    }

    /** Determines whether this Delete operation is reversible.
     *  @type Boolean
     */
    isReversible() {
        return (this.what instanceof SegmentBuffer);
    }

    /** Applies this Delete operation to a buffer.
     *  @param {SegmentBuffer} buffer The buffer to which the operation is to be applied.
     */
    apply(buffer: SegmentBuffer) {
        buffer.splice(this.position, this.getLength());
    }

    cid(other) {
    }

    /** Returns the number of characters that this Delete operation removes.
     *  @type number
     */
    getLength(): number {
        if (this.isReversible())
            return (<SegmentBuffer>this.what).getLength();
        else
            return <number>this.what;
    }

    /** Splits this Delete operation into two Delete operations at the given
     *  offset. The resulting Split operation will consist of two Delete
     *  operations which, when combined, affect the same range of text as the
     *  original Delete operation.
     *  @param {number} at Offset at which to split the Delete operation.
     *  @type Split
     */
    split(at) {
        if (this.isReversible()) {
            // This is a reversible Delete operation. No need to to any
            // processing for recon data.
            return new Split(
                new Delete(this.position, (<SegmentBuffer>this.what).slice(0, at)),
                new Delete(this.position + at, (<SegmentBuffer>this.what).slice(at))
            );
        } else {
            // This is a non-reversible Delete operation that might carry recon
            // data. We need to split that data accordingly between the two new
            // components.
            const recon1 = new Recon();
            const recon2 = new Recon();

            for (let index in this.recon.segments) {
                if (this.recon.segments[index].offset < at)
                    recon1.segments.push(this.recon.segments[index]);
                else
                    recon2.segments.push(
                        new ReconSegment(this.recon.segments[index].offset - at,
                            this.recon.segments[index].buffer)
                    );
            }

            return new Split(
                new Delete(this.position, at, recon1),
                new Delete(this.position + at, <number>this.what - at, recon2)
            );
        }
    }

    /** Returns the range of text in a buffer that this Delete or Split-Delete
     *  operation removes.
     *  @param operation A Split-Delete or Delete operation
     *  @param {SegmentBuffer} buffer
     *  @type SegmentBuffer
     */
    static getAffectedString(operation, buffer) {
        if (operation instanceof Split) {
            // The other operation is a Split operation. We call this function
            // again recursively for each component.
            const part1 = Delete.getAffectedString(operation.first,
                buffer);
            const part2 = Delete.getAffectedString(operation.second,
                buffer);

            part2.splice(0, 0, part1);
            return part2;
        } else if (operation instanceof Delete) {
            // In the process of determining the affected string, we also
            // have to take into account the data that has been "transformed away"
            // from the Delete operation and which is stored in the Recon object.

            const reconSegmentBuffer = buffer.slice(operation.position, operation.position
                + operation.getLength());

            operation.recon.restore(reconSegmentBuffer);

            return reconSegmentBuffer;
        }
    }

    /** Makes this Delete operation reversible, given a transformed version of
     *  this operation in a buffer matching its state. If this Delete operation is
     *  already reversible, this function simply returns a copy of it.
     *  @param {Delete} transformed A transformed version of this
     *  operation.
     *  @param {State} state The state in which the transformed operation could be
     *  applied.
     */
    makeReversible(transformed: Delete, state: State) {
        if (this.what instanceof SegmentBuffer)
            return new Delete(this.position, this.what);
        else {
            return new Delete(this.position,
                Delete.getAffectedString(transformed, state.buffer)
            );
        }
    }

    /** Merges a Delete operation with another one. The resulting Delete operation
     *  removes the same range of text as the two separate Delete operations would
     *  when executed sequentially.
     *  @param {Delete} other
     *  @type Delete
     */
    merge(other) {
        if (this.isReversible()) {
            if (!other.isReversible())
                throw "Cannot merge reversible operations with non-reversible ones";

            const newSegmentBuffer = (<SegmentBuffer>this.what).copy();
            newSegmentBuffer.splice(newSegmentBuffer.getLength(), 0, other.what);
            return new Delete(this.position, newSegmentBuffer);
        } else {
            const newLength = this.getLength() + other.getLength();
            return new Delete(this.position, newLength);
        }
    }

    /** Transforms this Delete operation against another operation.
     *  @param {Operation} other
     *  @param {Operation} [cid]
     */
    transform(other: Operation, cid?: Operation) {
        if (other instanceof NoOp)
            return new Delete(this.position, this.what, this.recon);

        if (other instanceof Split) {
            // We transform against the first component of the split operation
            // first.
            const transformFirst = this.transform(other.first,
                (cid == this ? this : other.first));

            // The second part of the split operation is transformed against its
            // first part.
            const newSecond = other.second.transform(other.first);

            const transformSecond = transformFirst.transform(newSecond,
                (cid == this ? transformFirst : newSecond));

            return transformSecond;
        }

        const pos1 = this.position;
        const len1 = this.getLength();

        const pos2 = other.position;
        const len2 = (<any>other).getLength();

        if (other instanceof Insert) {
            if (pos2 >= pos1 + len1)
                return new Delete(pos1, this.what, this.recon);
            if (pos2 <= pos1)
                return new Delete(pos1 + len2, this.what, this.recon);
            if (pos2 > pos1 && pos2 < pos1 + len1) {
                let result = this.split(pos2 - pos1);
                result.second.position += len2;
                return result;
            }
        } else if (other instanceof Delete) {
            if (pos1 + len1 <= pos2)
                return new Delete(pos1, this.what, this.recon);
            if (pos1 >= pos2 + len2)
                return new Delete(pos1 - len2, this.what, this.recon);
            if (pos2 <= pos1 && pos2 + len2 >= pos1 + len1) {
                /*     1XXXXX|
                 * 2-------------|
                 *
                 * This operation falls completely within the range of another,
                 * i.e. all data has already been removed. The resulting
                 * operation removes nothing.
                 */
                const newData = (this.isReversible() ? new SegmentBuffer() : 0);
                const newRecon = this.recon.update(0,
                    (<SegmentBuffer>other.what).slice(pos1 - pos2, pos1 - pos2 + len1));
                return new Delete(pos2, newData, newRecon);
            }
            if (pos2 <= pos1 && pos2 + len2 < pos1 + len1) {
                /*     1XXXX----|
                 * 2--------|
                 *
                 * The first part of this operation falls within the range of
                 * another.
                 */
                let result = this.split(pos2 + len2 - pos1);
                result.second.position = pos2;
                result.second.recon = this.recon.update(0,
                    (<SegmentBuffer>other.what).slice(pos1 - pos2));
                return result.second;
            }
            if (pos2 > pos1 && pos2 + len2 >= pos1 + len1) {
                /* 1----XXXXX|
                 *     2--------|
                 *
                 * The second part of this operation falls within the range of
                 * another.
                 */
                let result = this.split(pos2 - pos1);
                result.first.recon = this.recon.update(result.first.getLength(), (<SegmentBuffer>other.what).slice(0, pos1 + len1 - pos2));
                return result.first;
            }
            if (pos2 > pos1 && pos2 + len2 < pos1 + len1) {
                /* 1-----XXXXXX---|
                 *      2------|
                 *
                 * Another operation falls completely within the range of this
                 * operation. We remove that part.
                 */

                // We split this operation two times: first at the beginning of
                // the second operation, then at the end of the second operation.
                const r1 = this.split(pos2 - pos1);
                const r2 = r1.second.split(len2);

                // The resulting Delete operation consists of the first and the
                // last part, which are merged back into a single operation.
                let result = r1.first.merge(r2.second);
                result.recon = this.recon.update(pos2 - pos1, (<SegmentBuffer>other.what));
                return result;
            }
        }
    }

    /** Mirrors this Delete operation. Returns an operation which inserts the text
     *  that this Delete operation would remove. If this Delete operation is not
     *  reversible, the return value is undefined.
     *  @type Insert
     */
    mirror() {
        if (this.isReversible())
            return new Insert(this.position, (<SegmentBuffer>this.what).copy());
    }
}