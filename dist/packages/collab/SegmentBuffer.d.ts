import Segment from './Segment';
export default class SegmentBuffer {
    segments: Array<Segment>;
    constructor(segments?: Array<Segment>);
    toString(): string;
    toHTML(): string;
    copy(): SegmentBuffer;
    compact(): void;
    getLength(): number;
    slice(begin: number, end?: number): SegmentBuffer;
    splice(index: number, remove?: number, insert?: SegmentBuffer): void;
}
