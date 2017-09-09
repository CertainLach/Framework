export default class Segment {
    user: number;
    text: string;

    /**
     * Stores a chunk of text together with the user it was written by
     * @param user User ID
     * @param text Text
     */
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

    /**
     * Creates a copy of this segment
     */
    copy():Segment {
        return new Segment(this.user, this.text)
    }
}