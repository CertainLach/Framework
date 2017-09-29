"use strict";
const SegmentBuffer_1 = require("../SegmentBuffer");
const Split_1 = require("./Split");
const NoOp_1 = require("./NoOp");
const Insert_1 = require("./Insert");
const Recon_1 = require("../Recon");
const ReconSegment_1 = require("../ReconSegment");
class Delete {
    constructor(position, what, recon = new Recon_1.default()) {
        this.requiresCID = false;
        this.position = position;
        if (what instanceof SegmentBuffer_1.default)
            this.what = what.copy();
        else
            this.what = what;
        this.recon = recon;
    }
    toString() {
        return `Delete(${this.position}, ${this.what})`;
    }
    toHTML() {
        return `Delete(${this.position}, ${this.what instanceof SegmentBuffer_1.default ? this.what.toHTML() : this.what})`;
    }
    isReversible() {
        return (this.what instanceof SegmentBuffer_1.default);
    }
    apply(buffer) {
        buffer.splice(this.position, this.getLength());
    }
    cid(other) {
    }
    getLength() {
        if (this.isReversible())
            return this.what.getLength();
        else
            return this.what;
    }
    split(at) {
        if (this.isReversible()) {
            return new Split_1.default(new Delete(this.position, this.what.slice(0, at)), new Delete(this.position + at, this.what.slice(at)));
        }
        else {
            const recon1 = new Recon_1.default();
            const recon2 = new Recon_1.default();
            for (let index in this.recon.segments) {
                if (this.recon.segments[index].offset < at)
                    recon1.segments.push(this.recon.segments[index]);
                else
                    recon2.segments.push(new ReconSegment_1.default(this.recon.segments[index].offset - at, this.recon.segments[index].buffer));
            }
            return new Split_1.default(new Delete(this.position, at, recon1), new Delete(this.position + at, this.what - at, recon2));
        }
    }
    static getAffectedString(operation, buffer) {
        if (operation instanceof Split_1.default) {
            const part1 = Delete.getAffectedString(operation.first, buffer);
            const part2 = Delete.getAffectedString(operation.second, buffer);
            part2.splice(0, 0, part1);
            return part2;
        }
        else if (operation instanceof Delete) {
            const reconSegmentBuffer = buffer.slice(operation.position, operation.position
                + operation.getLength());
            operation.recon.restore(reconSegmentBuffer);
            return reconSegmentBuffer;
        }
    }
    makeReversible(transformed, state) {
        if (this.what instanceof SegmentBuffer_1.default)
            return new Delete(this.position, this.what);
        else {
            return new Delete(this.position, Delete.getAffectedString(transformed, state.buffer));
        }
    }
    merge(other) {
        if (this.isReversible()) {
            if (!other.isReversible())
                throw "Cannot merge reversible operations with non-reversible ones";
            const newSegmentBuffer = this.what.copy();
            newSegmentBuffer.splice(newSegmentBuffer.getLength(), 0, other.what);
            return new Delete(this.position, newSegmentBuffer);
        }
        else {
            const newLength = this.getLength() + other.getLength();
            return new Delete(this.position, newLength);
        }
    }
    transform(other, cid) {
        if (other instanceof NoOp_1.default)
            return new Delete(this.position, this.what, this.recon);
        if (other instanceof Split_1.default) {
            const transformFirst = this.transform(other.first, (cid == this ? this : other.first));
            const newSecond = other.second.transform(other.first);
            const transformSecond = transformFirst.transform(newSecond, (cid == this ? transformFirst : newSecond));
            return transformSecond;
        }
        const pos1 = this.position;
        const len1 = this.getLength();
        const pos2 = other.position;
        const len2 = other.getLength();
        if (other instanceof Insert_1.default) {
            if (pos2 >= pos1 + len1)
                return new Delete(pos1, this.what, this.recon);
            if (pos2 <= pos1)
                return new Delete(pos1 + len2, this.what, this.recon);
            if (pos2 > pos1 && pos2 < pos1 + len1) {
                let result = this.split(pos2 - pos1);
                result.second.position += len2;
                return result;
            }
        }
        else if (other instanceof Delete) {
            if (pos1 + len1 <= pos2)
                return new Delete(pos1, this.what, this.recon);
            if (pos1 >= pos2 + len2)
                return new Delete(pos1 - len2, this.what, this.recon);
            if (pos2 <= pos1 && pos2 + len2 >= pos1 + len1) {
                const newData = (this.isReversible() ? new SegmentBuffer_1.default() : 0);
                const newRecon = this.recon.update(0, other.what.slice(pos1 - pos2, pos1 - pos2 + len1));
                return new Delete(pos2, newData, newRecon);
            }
            if (pos2 <= pos1 && pos2 + len2 < pos1 + len1) {
                let result = this.split(pos2 + len2 - pos1);
                result.second.position = pos2;
                result.second.recon = this.recon.update(0, other.what.slice(pos1 - pos2));
                return result.second;
            }
            if (pos2 > pos1 && pos2 + len2 >= pos1 + len1) {
                let result = this.split(pos2 - pos1);
                result.first.recon = this.recon.update(result.first.getLength(), other.what.slice(0, pos1 + len1 - pos2));
                return result.first;
            }
            if (pos2 > pos1 && pos2 + len2 < pos1 + len1) {
                const r1 = this.split(pos2 - pos1);
                const r2 = r1.second.split(len2);
                let result = r1.first.merge(r2.second);
                result.recon = this.recon.update(pos2 - pos1, other.what);
                return result;
            }
        }
    }
    mirror() {
        if (this.isReversible())
            return new Insert_1.default(this.position, this.what.copy());
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Delete;
//# sourceMappingURL=Delete.js.map