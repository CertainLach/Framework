export default class Segment {
    user: number;
    text: string;
    /**
     * Stores a chunk of text together with the user it was written by
     * @param user User ID
     * @param text Text
     */
    constructor(user: number, text: string);
    toString(): string;
    toHTML(): string;
    /**
     * Creates a copy of this segment
     */
    copy(): Segment;
}
