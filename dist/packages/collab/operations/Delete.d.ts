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
    constructor(position: number, what: number | SegmentBuffer, recon?: Recon);
    toString(): string;
    toHTML(): string;
    isReversible(): boolean;
    apply(buffer: SegmentBuffer): void;
    cid(other: any): void;
    getLength(): number;
    split(at: any): Split;
    static getAffectedString(operation: any, buffer: any): SegmentBuffer;
    makeReversible(transformed: Operation, state: State): Delete;
    merge(other: any): Delete;
    transform(other: Operation, cid?: Operation): any;
    mirror(): Insert;
}
