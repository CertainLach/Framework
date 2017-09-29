"use strict";
class Segment {
    constructor(user, text) {
        this.user = user;
        this.text = text;
    }
    toString() {
        return this.text;
    }
    toHTML() {
        const text = this.text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
        return `<span class="segment user-${this.user}">${text}</span>`;
    }
    copy() {
        return new Segment(this.user, this.text);
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Segment;
//# sourceMappingURL=Segment.js.map