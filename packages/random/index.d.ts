export default class Random {
    wrapped: any;
    constructor(seed?: string | number);
    nextFloat(): number;
    nextInt(min: number, max: number): number;
    randomArrayElement(array: Array<any>): any;
    randomColor(): string;
}
