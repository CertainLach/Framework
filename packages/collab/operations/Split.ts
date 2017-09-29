import {Operation} from '../Operation';
import SegmentBuffer from '../SegmentBuffer';

export default class Split implements Operation {
    requiresCID = true;
    first: Operation;
    second: Operation;

    /**
     * An operation which wraps two different operations into a single object. 
     * This is necessary for example in order to transform a Delete operation against 
     * an Insert operation which falls into the range that is to be deleted
     * @param first 
     * @param second 
     */
    constructor(first: Operation, second: Operation) {
        this.first = first;
        this.second = second;
    }

    toString() {
        return `Split(${this.first}, ${this.second})`;
    }

    toHTML() {
        return `Split(${this.first.toHTML()}, ${this.second.toHTML()})`;
    }

    /**
     * Applies the two components of this split operation to the given buffer sequentially.
     *  The second component is implicitly transformed against the first one in order to do so.
     * @param buffer The buffer to which this operation is to be applied
     */
    apply(buffer: SegmentBuffer) {
        this.first.apply(buffer);
        const transformedSecond = this.second.transform(this.first);
        transformedSecond.apply(buffer);
    }

    cid() {
    }

    /**
     * Transforms this Split operation against another operation. 
     * This is done by transforming both components individually.
     * @param other 
     * @param cid 
     */
    transform(other: Operation, cid?: Operation) {
        if (cid === this || cid == other)
            return new Split(
                this.first.transform(other, (cid === this ? this.first : other)),
                this.second.transform(other, (cid === this ? this.second : other))
            );
        else
            return new Split(
                this.first.transform(other),
                this.second.transform(other)
            );
    }

    /**
     * Mirrors this Split operation. This is done by transforming the second component 
     * against the first one, then mirroring both components individually
     */
    mirror(): Split {
        const newSecond = this.second.transform(this.first);
        return new Split(this.first.mirror(), newSecond.mirror());
    }
}