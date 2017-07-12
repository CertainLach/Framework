/** Creates a new Segment instance given a user ID and a string.
 *  @param user User ID
 *  @param text Text
 *  @class Stores a chunk of text together with the user it was written by.
 */
export default class Segment {
    user: number;
    text: string;

    constructor(user: number, text: string) {
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

    /** Creates a copy of this segment.
     *  @returns {Segment} A copy of this segment.
     */
    copy() {
        return new Segment(this.user, this.text)
    }
}