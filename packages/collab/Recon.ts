import SegmentBuffer from "./SegmentBuffer";
import ReconSegment from "./ReconSegment";

export default class Recon {
    segments: Array<ReconSegment>;

    /**
     * The Recon class is a helper class which collects the parts of a
     * Delete operation that are lost during transformation. This is used to
     * reconstruct the text of a remote Delete operation that was issued in a
     * previous state, and thus to make such a Delete operation reversible
     * @param recon Pre-initialize the Recon object with data from
     * another object
     */
    constructor(recon?: Recon) {
        if (recon)
            this.segments = recon.segments.slice(0);
        else
            this.segments = new Array();
    }

    toString() {
        return `Recon(${this.segments})`;
    }

    /**
     * Creates a new Recon object with an additional piece of text to be restored later
     * @param offset 
     * @param buffer 
     */
    update(offset: number, buffer: SegmentBuffer): Recon {
        const newRecon = new Recon(this);
        if (buffer instanceof SegmentBuffer)
            newRecon.segments.push(new ReconSegment(offset, buffer));
        return newRecon;
    }

    /**
     * Restores the recon data in the given buffer
     * @param buffer 
     */
    restore(buffer: SegmentBuffer) {
        for (const index in this.segments) {
            const segment = this.segments[index];
            buffer.splice(segment.offset, 0, segment.buffer);
        }
    }
}