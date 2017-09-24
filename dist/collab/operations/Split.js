"use strict";
class Split {
    constructor(first, second) {
        this.requiresCID = true;
        this.first = first;
        this.second = second;
    }
    toString() {
        return `Split(${this.first}, ${this.second})`;
    }
    toHTML() {
        return `Split(${this.first.toHTML()}, ${this.second.toHTML()})`;
    }
    apply(buffer) {
        this.first.apply(buffer);
        const transformedSecond = this.second.transform(this.first);
        transformedSecond.apply(buffer);
    }
    cid() {
    }
    transform(other, cid) {
        if (cid === this || cid == other)
            return new Split(this.first.transform(other, (cid === this ? this.first : other)), this.second.transform(other, (cid === this ? this.second : other)));
        else
            return new Split(this.first.transform(other), this.second.transform(other));
    }
    mirror() {
        const newSecond = this.second.transform(this.first);
        return new Split(this.first.mirror(), newSecond.mirror());
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Split;
//# sourceMappingURL=Split.js.map