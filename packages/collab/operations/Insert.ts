import {Operation} from '../Operation';
import SegmentBuffer from "../SegmentBuffer";
import NoOp from "./NoOp";
import Split from "./Split";
import Delete from "./Delete";

export default class Insert implements Operation {
    requiresCID = true;
    text: SegmentBuffer;
    position: number;

    /**
     * An operation that inserts a SegmentBuffer at a certain offset.
     * @param position The offset at which the text is to be inserted
     * @param text The SegmentBuffer to insert
     */
    constructor(position: number, text: SegmentBuffer) {
        this.position = position;
        this.text = text.copy();
    }

    toString() {
        return `Insert(${this.position}, ${this.text})`;
    }

    toHTML() {
        return `Insert(${this.position}, ${this.text.toHTML()})`;
    }

    /**
     * Applies the insert operation to the given SegmentBuffer
     * @param buffer The buffer in which the insert operation is to be performed.
     */
    apply(buffer: SegmentBuffer) {
        buffer.splice(this.position, 0, this.text);
    }

    /**
     * Computes the concurrency ID against another Insert operation
     * @param other 
     */
    cid(other: Insert): Insert {
        if (this.position < other.position)
            return other;
        if (this.position > other.position)
            return this;
        throw new Error('2 operations have same position');
    }

    /**
     * Returns the total length of data to be inserted by this insert operation, in characters.
     */
    getLength(): number {
        return this.text.getLength();
    }

    /**
     * Transforms this Insert operation against another operation, returning the resulting operation as a new object.
     * @param other The operation to transform against
     * @param cid The cid to take into account in the case of conflicts
     */
    transform(other: Operation, cid?: Operation): Operation {
        if (other instanceof NoOp)
            return new Insert(this.position, this.text);

        if (other instanceof Split) {
            // We transform against the first component of the split operation first.
            const transformFirst = this.transform(other.first,
                (cid == this ? this : other.first));

            // The second part of the split operation is transformed against its first part.
            const newSecond = other.second.transform(other.first);

            const transformSecond = transformFirst.transform(newSecond,
                (cid == this ? transformFirst : newSecond));

            return transformSecond;
        }

        const pos1 = this.position;
        const str1 = this.text;
        const pos2 = other.position;

        if (other instanceof Insert) {
            const str2 = other.text;

            if (pos1 < pos2 || (pos1 == pos2 && cid == other))
                return new Insert(pos1, str1);
            if (pos1 > pos2 || (pos1 == pos2 && cid == this))
                return new Insert(pos1 + str2.getLength(), str1);
        } else if (other instanceof Delete) {
            const len2 = other.getLength();

            if (pos1 >= pos2 + len2)
                return new Insert(pos1 - len2, str1);
            if (pos1 < pos2)
                return new Insert(pos1, str1);
            if (pos1 >= pos2 && pos1 < pos2 + len2)
                return new Insert(pos2, str1);
        }
        throw new Error('Transforming Insert against unknown request!');
    }

    /**
     * Returns the inversion of this Insert operation
     */
    mirror(): Delete {
        return new Delete(this.position, this.text.copy());
    }
}