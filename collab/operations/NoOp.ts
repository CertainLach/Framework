import Operation from '../Operation';
import SegmentBuffer from '../SegmentBuffer';

/**
 * Instantiates a new NoOp operation object.
 *  @class An operation that does nothing.
 */
export default class NoOp implements Operation {
    requiresCID = false;

    toString() {
        return "NoOp()";
    }

    /** Applies this NoOp operation to a buffer. This does nothing, per
     *  definition. */
    apply(buffer: SegmentBuffer) {
    }

    /** Transforms this NoOp operation against another operation. This returns a
     *  new NoOp operation.
     *  @type NoOp
     */
    transform(other: Operation) {
        return new NoOp();
    }

    /** Mirrors this NoOp operation. This returns a new NoOp operation.
     *  @type NoOp
     */
    mirror() {
        return new NoOp();
    }

    toHTML() {
        return this.toString();
    }
}