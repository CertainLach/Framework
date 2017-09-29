import { Operation } from '../Operation';
import SegmentBuffer from '../SegmentBuffer';
export default class Split implements Operation {
    requiresCID: boolean;
    first: Operation;
    second: Operation;
    constructor(first: Operation, second: Operation);
    toString(): string;
    toHTML(): string;
    apply(buffer: SegmentBuffer): void;
    cid(): void;
    transform(other: Operation, cid?: Operation): any;
    mirror(): Split;
}
