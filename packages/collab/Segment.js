var Segment = /** @class */ (function () {
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
export default Segment;
//# sourceMappingURL=Segment.js.map