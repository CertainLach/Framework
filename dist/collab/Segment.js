(function (dependencies, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    }
})(["require", "exports"], function (require, exports) {
    "use strict";
    var Segment = (function () {
        /**
         * Stores a chunk of text together with the user it was written by
         * @param user User ID
         * @param text Text
         */
        function Segment(user, text) {
            this.user = user;
            this.text = text;
        }
        Segment.prototype.toString = function () {
            return this.text;
        };
        Segment.prototype.toHTML = function () {
            var text = this.text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;");
            return "<span class=\"segment user-" + this.user + "\">" + text + "</span>";
        };
        /**
         * Creates a copy of this segment
         */
        Segment.prototype.copy = function () {
            return new Segment(this.user, this.text);
        };
        return Segment;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Segment;
});
//# sourceMappingURL=Segment.js.map