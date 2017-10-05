export default class Vector {
    static user_regex: RegExp;
    static timestring_regex: RegExp;
    toHTML(): string;
    users: {
        [key: string]: number;
    };
    constructor(value: Vector | string);
    eachUser(callback: (u: number, v: number) => boolean): boolean;
    toString(): string;
    add(other: Vector): Vector;
    copy(): Vector;
    get(user: number): number;
    causallyBefore(other: Vector): boolean;
    equals(other: Vector): boolean;
    incr(user: any, by?: number): Vector;
    static leastCommonSuccessor(v1: Vector, v2: Vector): Vector;
}
