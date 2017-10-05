"use strict";
const Segment_1 = require("./Segment");
class SegmentBuffer {
    constructor(segments) {
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
    copy() {
        return this.slice(0);
    }
    compact() {
        let segmentIndex = 0;
        while (segmentIndex < this.segments.length) {
            if (this.segments[segmentIndex].text.length == 0) {
                this.segments.splice(segmentIndex, 1);
                continue;
            }
            else if (segmentIndex < this.segments.length - 1 &&
                this.segments[segmentIndex].user == this.segments[segmentIndex + 1].user) {
                this.segments[segmentIndex].text += this.segments[segmentIndex + 1].text;
                this.segments.splice(segmentIndex + 1, 1);
                continue;
            }
            segmentIndex += 1;
        }
    }
    getLength() {
        let length = 0;
        for (let index = 0; index < this.segments.length; index++)
            length += this.segments[index].text.length;
        return length;
    }
    slice(begin, end) {
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
                const newText = segment.text.slice(sliceBegin - segmentOffset, sliceEnd - segmentOffset);
                const newSegment = new Segment_1.default(segment.user, newText);
                result.segments.push(newSegment);
                sliceBegin += newText.length;
            }
            segmentOffset += segment.text.length;
            segmentIndex += 1;
        }
        result.compact();
        return result;
    }
    splice(index, remove, insert) {
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
                const removedText = segment.text.slice(spliceIndex, spliceIndex + spliceCount);
                if (spliceIndex == 0) {
                    if (spliceIndex + spliceCount < segment.text.length) {
                        if (spliceInsertOffset == undefined)
                            spliceInsertOffset = segmentIndex;
                        segment.text = segment.text.slice(spliceIndex +
                            spliceCount);
                    }
                    else {
                        if (spliceInsertOffset == undefined)
                            spliceInsertOffset = segmentIndex;
                        segment.text = "";
                        this.segments.splice(segmentIndex, 1);
                        segmentIndex -= 1;
                    }
                }
                else {
                    if (spliceInsertOffset == undefined)
                        spliceInsertOffset = segmentIndex + 1;
                    if (spliceIndex + spliceCount < segment.text.length) {
                        const splicePost = new Segment_1.default(segment.user, segment.text.slice(spliceIndex + spliceCount));
                        segment.text = segment.text.slice(0, spliceIndex);
                        this.segments.splice(segmentIndex + 1, 0, splicePost);
                    }
                    else {
                        segment.text = segment.text.slice(0, spliceIndex);
                    }
                }
                spliceCount -= removedText.length;
            }
            if (spliceIndex < segment.text.length && spliceCount == 0) {
                if (spliceInsertOffset == undefined)
                    spliceInsertOffset = spliceIndex;
                break;
            }
            spliceIndex -= segment.text.length;
            segmentIndex += 1;
        }
        if (insert instanceof SegmentBuffer) {
            if (spliceInsertOffset == undefined)
                spliceInsertOffset = this.segments.length;
            for (let insertIndex = 0; insertIndex < insert.segments.length; insertIndex++) {
                this.segments.splice(spliceInsertOffset + insertIndex, 0, insert.segments[insertIndex].copy());
            }
        }
        this.compact();
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SegmentBuffer;
//# sourceMappingURL=SegmentBuffer.js.map