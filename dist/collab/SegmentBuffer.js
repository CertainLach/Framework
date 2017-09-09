(function (dependencies, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    }
})(["require", "exports", "./Segment"], function (require, exports) {
    "use strict";
    var Segment_1 = require("./Segment");
    var SegmentBuffer = (function () {
        /**
         * Holds multiple Segments and provides methods for modifying them at
         * a character level.
         * @param segments The segments that this buffer should be
         * pre-filled with.
         */
        function SegmentBuffer(segments) {
            this.segments = [];
            if (segments && segments.length) {
                for (var index in segments)
                    this.segments.push(segments[index].copy());
            }
        }
        SegmentBuffer.prototype.toString = function () {
            return this.segments.join("");
        };
        SegmentBuffer.prototype.toHTML = function () {
            var result = '<span class="buffer">';
            for (var index = 0; index < this.segments.length; index++)
                result += this.segments[index].toHTML();
            result += '</span>';
            return result;
        };
        /**
         * Creates a deep copy of this buffer
         */
        SegmentBuffer.prototype.copy = function () {
            return this.slice(0);
        };
        /**
         * Cleans up the buffer by removing empty segments and combining adjacent
         * segments by the same user
         */
        SegmentBuffer.prototype.compact = function () {
            var segmentIndex = 0;
            while (segmentIndex < this.segments.length) {
                if (this.segments[segmentIndex].text.length == 0) {
                    // This segment is empty, remove it.
                    this.segments.splice(segmentIndex, 1);
                    continue;
                }
                else if (segmentIndex < this.segments.length - 1 &&
                    this.segments[segmentIndex].user == this.segments[segmentIndex + 1].user) {
                    // Two consecutive segments are from the same user; merge them into one.
                    this.segments[segmentIndex].text += this.segments[segmentIndex + 1].text;
                    this.segments.splice(segmentIndex + 1, 1);
                    continue;
                }
                segmentIndex += 1;
            }
        };
        /**
         * Calculates the total number of characters contained in this buffer
         */
        SegmentBuffer.prototype.getLength = function () {
            var length = 0;
            for (var index = 0; index < this.segments.length; index++)
                length += this.segments[index].text.length;
            return length;
        };
        /**
         * Extracts a deep copy of a range of characters in this buffer and returns
         * it as a new SegmentBuffer object
         * @param begin Index of first character to return
         * @param end Index of last character (exclusive). If not
         * provided, defaults to the total length of the buffer
         */
        SegmentBuffer.prototype.slice = function (begin, end) {
            var result = new SegmentBuffer();
            var segmentIndex = 0;
            var segmentOffset = 0;
            var sliceBegin = begin;
            var sliceEnd = end;
            if (sliceEnd == undefined)
                sliceEnd = Number.MAX_VALUE;
            while (segmentIndex < this.segments.length && sliceEnd >= segmentOffset) {
                var segment = this.segments[segmentIndex];
                if (sliceBegin - segmentOffset < segment.text.length &&
                    sliceEnd - segmentOffset > 0) {
                    var newText = segment.text.slice(sliceBegin - segmentOffset, sliceEnd - segmentOffset);
                    var newSegment = new Segment_1.default(segment.user, newText);
                    result.segments.push(newSegment);
                    sliceBegin += newText.length;
                }
                segmentOffset += segment.text.length;
                segmentIndex += 1;
            }
            result.compact();
            return result;
        };
        /**
         * Like the Array "splice" method, this method allows for removing and
         * inserting text in a buffer at a character level
         * @param index The offset at which to begin inserting/removing
         * @param remove number of characters to remove
         * @param insert SegmentBuffer to insert
         */
        SegmentBuffer.prototype.splice = function (index, remove, insert) {
            if (index > this.getLength())
                throw new Error("SegmentBuffer splice operation out of bounds");
            var segmentIndex = 0;
            var segmentOffset = 0;
            var spliceIndex = index;
            var spliceCount = remove;
            var spliceInsertOffset = undefined;
            while (segmentIndex < this.segments.length) {
                var segment = this.segments[segmentIndex];
                if (spliceIndex >= 0 && spliceIndex < segment.text.length) {
                    // This segment is part of the region to splice.
                    // Store the text that this splice operation removes to adjust the splice offset correctly later on.
                    var removedText = segment.text.slice(spliceIndex, spliceIndex + spliceCount);
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
                        }
                        else {
                            // abcdefg
                            // ^-----^  Remove the entire segment
                            if (spliceInsertOffset == undefined)
                                spliceInsertOffset = segmentIndex;
                            segment.text = "";
                            this.segments.splice(segmentIndex, 1);
                            segmentIndex -= 1;
                        }
                    }
                    else {
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
                            var splicePost = new Segment_1.default(segment.user, segment.text.slice(spliceIndex + spliceCount));
                            segment.text = segment.text.slice(0, spliceIndex);
                            this.segments.splice(segmentIndex + 1, 0, splicePost);
                        }
                        else {
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
                for (var insertIndex = 0; insertIndex < insert.segments.length; insertIndex++) {
                    this.segments.splice(spliceInsertOffset + insertIndex, 0, insert.segments[insertIndex].copy());
                }
            }
            // Clean up since the splice operation might have fragmented some segments.
            this.compact();
        };
        return SegmentBuffer;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = SegmentBuffer;
});
//# sourceMappingURL=SegmentBuffer.js.map