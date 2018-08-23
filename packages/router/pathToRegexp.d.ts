export interface Options {
    sensitive?: boolean;
    strict?: boolean;
    end?: boolean;
    endsWith?: string | string[];
}
export interface IKey {
    name: string | number;
    prefix: string;
    delimiter: string;
    optional: boolean;
    repeat: boolean;
    pattern: string;
    partial: boolean;
}
export declare class Key implements IKey {
    constructor(data: IKey);
    delimiter: string;
    name: string | number;
    optional: boolean;
    partial: boolean;
    pattern: string;
    prefix: string;
    repeat: boolean;
}
export declare type Token = string | Key;
export declare type Path = string | RegExp | Array<string | RegExp>;
export declare type PathFunction = (data?: Object) => string;
export default function pathToRegexp(path: Path, keys: Key[], options: Options): RegExp;
