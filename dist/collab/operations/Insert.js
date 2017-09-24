"use strict";
const NoOp_1 = require("./NoOp");
const Split_1 = require("./Split");
const Delete_1 = require("./Delete");
class Insert {
    constructor(position, text) {
        this.requiresCID = true;
        this.position = position;
        this.text = text.copy();
    }
    toString() {
        return `Insert(${this.position}, ${this.text})`;
    }
    toHTML() {
        return `Insert(${this.position}, ${this.text.toHTML()})`;
    }
    apply(buffer) {
        buffer.splice(this.position, 0, this.text);
    }
    cid(other) {
        if (this.position < other.position)
            return other;
        if (this.position > other.position)
            return this;
    }
    getLength() {
        return this.text.getLength();
    }
    transform(other, cid) {
        if (other instanceof NoOp_1.default)
            return new Insert(this.position, this.text);
        if (other instanceof Split_1.default) {
            const transformFirst = this.transform(other.first, (cid == this ? this : other.first));
            const newSecond = other.second.transform(other.first);
            const transformSecond = transformFirst.transform(newSecond, (cid == this ? transformFirst : newSecond));
            return transformSecond;
        }
        const pos1 = this.position;
        const str1 = this.text;
        const pos2 = other.position;
        if (other instanceof Insert) {
            const str2 = other.text;
            if (pos1 < pos2 || (pos1 == pos2 && cid == other))
                return new Insert(pos1, str1);
            if (pos1 > pos2 || (pos1 == pos2 && cid == this))
                return new Insert(pos1 + str2.getLength(), str1);
        }
        else if (other instanceof Delete_1.default) {
            const len2 = other.getLength();
            if (pos1 >= pos2 + len2)
                return new Insert(pos1 - len2, str1);
            if (pos1 < pos2)
                return new Insert(pos1, str1);
            if (pos1 >= pos2 && pos1 < pos2 + len2)
                return new Insert(pos2, str1);
        }
    }
    mirror() {
        return new Delete_1.default(this.position, this.text.copy());
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Insert;
//# sourceMappingURL=Insert.js.map