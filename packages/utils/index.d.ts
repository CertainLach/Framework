/// <reference types="node" />
import { Readable } from 'stream';
export declare function firstUppercase(str: string): string;
export declare function objectEquals(x: any, y: any): boolean;
export declare function flatten(array: any[], result?: any[]): any[];
export declare function removeDuplicates<T>(array: T[]): T[];
export declare function mix(array1: any[] | Object, array2: any[] | Object): any;
export declare function createPrivateEnum(...values: string[]): {
    [key: string]: Symbol;
};
export declare function fixLength(string: string, length: number, insertPre?: boolean, symbol?: string): string;
declare global  {
    interface ObjectConstructor {
        values(object: any): any;
    }
}
export declare function objectMap(object: any, cb: (a: any, b: any, c: any) => any): any;
export declare function arrayKVObject(keys: string[], values: any[]): any;
export declare function sleep(time: number): Promise<void>;
/**
 * Like iterable.map(cb),
 * but cb can be async
 * @param iterable Array to process
 * @param cb Function to do with each element
 */
export declare function asyncEach<T, R>(iterable: T[], cb: (v: T) => Promise<R>): R[];
/**
 * Convert callback function to async
 * @param cbFunction Function to convert
 */
export declare function cb2promise(cbFunction: any): (...d: any[]) => Promise<any>;
export declare function hashCode(s: string): number;
export declare function djb2Code(str: string): number;
export declare function sdbmCode(str: string): number;
export declare function loseCode(str: string): number;
export declare function encodeHtmlSpecials(str: string): string;
export declare function createReadStream(object: Buffer, options?: {}): MultiStream;
export declare function readStreamToBuffer(stream: Readable, maxSize?: number): Promise<Buffer>;
export interface IMultiStreamOptions {
    highWaterMark?: number;
    encoding?: string;
}
export declare class MultiStream extends Readable {
    private object;
    constructor(object: Buffer, options?: IMultiStreamOptions);
    _read(): void;
}
