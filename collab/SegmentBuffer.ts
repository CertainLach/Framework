import Segment from './Segment';

export default class SegmentBuffer {
    segments: Array<Segment>;

    /**
     * Holds multiple Segments and provides methods for modifying them at
     * a character level.
     * @param segments The segments that this buffer should be
     * pre-filled with.
     */
    constructor(segments?: Array<Segment>) {
        this.segments = [];

        if (segments && segments.length) {
            for (const index in segments)
                this.segments.push(segments[index].copy());
        }
    }

    toString() {
        return this.segments.join("");
    }

    toHTML() {
        let result = '<span class="buffer">';
        for (let index = 0; index < this.segments.length; index++)
            result += this.segments[index].toHTML();
        result += '</span>';
        return result;
    }

    /**
     * Creates a deep copy of this buffer
     */
    copy(): SegmentBuffer {
        return this.slice(0);
    }

    /**
     * Cleans up the buffer by removing empty segments and combining adjacent
     * segments by the same user
     */
    compact() {
        let segmentIndex = 0;
        while (segmentIndex < this.segments.length) {
            if (this.segments[segmentIndex].text.length == 0) {
                // This segment is empty, remove it.
                this.segments.splice(segmentIndex, 1);
                continue;
            } else if (segmentIndex < this.segments.length - 1 &&
                this.segments[segmentIndex].user == this.segments[segmentIndex + 1].user) {

                // Two consecutive segments are from the same user; merge them into one.
                this.segments[segmentIndex].text += this.segments[segmentIndex + 1].text;

                this.segments.splice(segmentIndex + 1, 1);
                continue;
            }

            segmentIndex += 1;
        }
    }

    /**
     * Calculates the total number of characters contained in this buffer
     */
    getLength(): number {
        let length = 0;
        for (let index = 0; index < this.segments.length; index++)
            length += this.segments[index].text.length;

        return length;
    }

    /**
     * Extracts a deep copy of a range of characters in this buffer and returns
     * it as a new SegmentBuffer object
     * @param begin Index of first character to return
     * @param end Index of last character (exclusive). If not
     * provided, defaults to the total length of the buffer
     */
    slice(begin: number, end?: number): SegmentBuffer {
        const result = new SegmentBuffer();

        let segmentIndex = 0;
        let segmentOffset = 0;
        let sliceBegin = begin;
        let sliceEnd = end;

        if (sliceEnd == undefined)
            sliceEnd = Number.MAX_VALUE;

        while (segmentIndex < this.segments.length && sliceEnd >= segmentOffset) {
            const segment = this.segments[segmentIndex];
            if (sliceBegin - segmentOffset < segment.text.length &&
                sliceEnd - segmentOffset > 0) {
                const newText = segment.text.slice(sliceBegin - segmentOffset,
                    sliceEnd - segmentOffset);
                const newSegment = new Segment(segment.user, newText);
                result.segments.push(newSegment);

                sliceBegin += newText.length;
            }

            segmentOffset += segment.text.length;
            segmentIndex += 1;
        }

        result.compact();

        return result;
    }

    /**
     * Like the Array "splice" method, this method allows for removing and
     * inserting text in a buffer at a character level
     * @param index The offset at which to begin inserting/removing
     * @param remove number of characters to remove
     * @param insert SegmentBuffer to insert
     */
    splice(index: number, remove?: number, insert?: SegmentBuffer) {
        if (index > this.getLength())
            throw new Error("SegmentBuffer splice operation out of bounds");

        let segmentIndex = 0;
        const segmentOffset = 0;
        let spliceIndex = index;
        let spliceCount = remove;
        let spliceInsertOffset = undefined;
        while (segmentIndex < this.segments.length) {
            const segment = this.segments[segmentIndex];

            if (spliceIndex >= 0 && spliceIndex < segment.text.length) {
                // This segment is part of the region to splice.

                // Store the text that this splice operation removes to adjust the splice offset correctly later on.
                const removedText = segment.text.slice(spliceIndex, spliceIndex + spliceCount);

                if (spliceIndex == 0) {
                    // abcdefg
                    // ^        We're splicing at the beginning of a segment

                    if (spliceIndex + spliceCount < segment.text.length) {
                        // abcdefg
                        // ^---^    Remove a part at the beginning

                        if (spliceInsertOffset == undefined)
                            spliceInsertOffset = segmentIndex;

                        segment.text = segment.text.slice(spliceIndex +
                            spliceCount);
                    } else {
                        // abcdefg
                        // ^-----^  Remove the entire segment

                        if (spliceInsertOffset == undefined)
                            spliceInsertOffset = segmentIndex;

                        segment.text = "";
                        this.segments.splice(segmentIndex, 1);
                        segmentIndex -= 1;
                    }
                } else {
                    // abcdefg
                    //   ^	    We're splicing inside a segment

                    if (spliceInsertOffset == undefined)
                        spliceInsertOffset = segmentIndex + 1;

                    if (spliceIndex + spliceCount < segment.text.length) {
                        // abcdefg
                        //   ^--^   Remove a part in between

                        // Note that if spliceCount == 0, this function only
                        // splits the segment in two. This is necessary in case we
                        // want to insert new segments later.

                        const splicePost = new Segment(segment.user,
                            segment.text.slice(spliceIndex + spliceCount));
                        segment.text = segment.text.slice(0, spliceIndex);
                        this.segments.splice(segmentIndex + 1, 0, splicePost);
                    } else {
                        // abcdefg
                        //   ^---^  Remove a part at the end

                        segment.text = segment.text.slice(0, spliceIndex);
                    }
                }

                spliceCount -= removedText.length;
            }

            if (spliceIndex < segment.text.length && spliceCount == 0) {
                // We have removed the specified amount of characters. No need to
                // continue this loop since nothing remains to be done.

                if (spliceInsertOffset == undefined)
                    spliceInsertOffset = spliceIndex;

                break;
            }

            spliceIndex -= segment.text.length;

            segmentIndex += 1;
        }

        if (insert instanceof SegmentBuffer) {
            // If a buffer has been given, we insert copies of its segments at the
            // specified position.

            if (spliceInsertOffset == undefined)
                spliceInsertOffset = this.segments.length;

            for (let insertIndex = 0; insertIndex < insert.segments.length;
                 insertIndex++) {
                this.segments.splice(spliceInsertOffset + insertIndex, 0,
                    insert.segments[insertIndex].copy());
            }
        }

        // Clean up since the splice operation might have fragmented some segments.
        this.compact();
    }
}