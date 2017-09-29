import {Operation} from '../Operation';
import SegmentBuffer from '../SegmentBuffer';

export default class NoOp implements Operation {
    requiresCID = false;

    /**
     * An operation that does nothing
     */
    constructor(){}

    toString() {
        return "NoOp()";
    }

    /**
     * Applies this NoOp operation to a buffer. This does nothing, per definition
     */
    apply(buffer: SegmentBuffer) {
    }

    /**
     * Transforms this NoOp operation against another operation. This returns a new NoOp operation
     */
    transform(other: Operation): NoOp {
        return new NoOp();
    }

    /**
     * Mirrors this NoOp operation. This returns a new NoOp operation
     */
    mirror(): NoOp {
        return new NoOp();
    }

    toHTML(): String {
        return this.toString();
    }
}