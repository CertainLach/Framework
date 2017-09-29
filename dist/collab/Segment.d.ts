export default class Segment {
    user: number;
    text: string;
    constructor(user: number, text: string);
    toString(): string;
    toHTML(): string;
    copy(): Segment;
}
