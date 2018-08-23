import Segment from './Segment';
export default class SegmentBuffer {
    segments: Array<Segment>;
    /**
     * Holds multiple Segments and provides methods for modifying them at
     * a character level.
     * @param segments The segments that this buffer should be
     * pre-filled with.
     */
    constructor(segments?: Array<Segment>);
    toString(): string;
    toHTML(): string;
    /**
     * Creates a deep copy of this buffer
     */
    copy(): SegmentBuffer;
    /**
     * Cleans up the buffer by removing empty segments and combining adjacent
     * segments by the same user
     */
    compact(): void;
    /**
     * Calculates the total number of characters contained in this buffer
     */
    getLength(): number;
    /**
     * Extracts a deep copy of a range of characters in this buffer and returns
     * it as a new SegmentBuffer object
     * @param begin Index of first character to return
     * @param end Index of last character (exclusive). If not
     * provided, defaults to the total length of the buffer
     */
    slice(begin: number, end?: number): SegmentBuffer;
    /**
     * Like the Array "splice" method, this method allows for removing and
     * inserting text in a buffer at a character level
     * @param index The offset at which to begin inserting/removing
     * @param remove number of characters to remove
     * @param insert SegmentBuffer to insert
     */
    splice(index: number, remove?: number, insert?: SegmentBuffer): void;
}
