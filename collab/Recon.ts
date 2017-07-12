import SegmentBuffer from "./SegmentBuffer";
import ReconSegment from "./ReconSegment";

/** Creates a new Recon object.
 *  @class The Recon class is a helper class which collects the parts of a
 *  Delete operation that are lost during transformation. This is used to
 *  reconstruct the text of a remote Delete operation that was issued in a
 *  previous state, and thus to make such a Delete operation reversible.
 *  @param {Recon} [recon] Pre-initialize the Recon object with data from
 *  another object.
*/
export default class Recon {
    segments: Array<ReconSegment>;

    constructor(recon?: Recon) {
        if (recon)
            this.segments = recon.segments.slice(0);
        else
            this.segments = new Array();
    }

    toString() {
        return `Recon(${this.segments})`;
    }

    /** Creates a new Recon object with an additional piece of text to be restored
     *  later.
     *  @param {number} offset
     *  @param {SegmentBuffer} buffer
     *  @type {Recon}
     */
    update(offset: number, buffer: SegmentBuffer) {
        const newRecon = new Recon(this);
        if (buffer instanceof SegmentBuffer)
            newRecon.segments.push(new ReconSegment(offset, buffer));
        return newRecon;
    }

    /** Restores the recon data in the given buffer.
     *  @param {SegmentBuffer} buffer
     */
    restore(buffer: SegmentBuffer) {
        for (const index in this.segments) {
            const segment = this.segments[index];
            buffer.splice(segment.offset, 0, segment.buffer);
        }
    }
}