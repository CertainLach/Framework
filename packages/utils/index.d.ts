/// <reference types="node" />
import { Readable } from 'stream';
export declare function firstUppercase(str: any): any;
export declare function objectEquals(x: any, y: any): any;
export declare function flatten(array: any, result?: any[]): any[];
export declare function removeDuplicates(array: any): any[];
export declare function mix(array1: any, array2: any): any;
export declare function createPrivateEnum(...values: any[]): {};
export declare function fixLength(string: any, length: any, insertPre?: boolean, symbol?: string): any;
declare global  {
    interface ObjectConstructor {
        values(object: any): any;
    }
}
export declare function objectMap(object: any, cb: any): any[];
export declare function arrayKVObject(keys: any, values: any): {};
export declare function sleep(time: any): Promise<{}>;
/**
 * Like iterable.map(cb),
 * but cb can be async
 * @param iterable Array to process
 * @param cb Function to do with each element
 */
export declare function asyncEach(iterable: any, cb: any): Promise<any[]>;
/**
 * Convert callback function to async
 * @param cbFunction Function to convert
 */
export declare function cb2promise(cbFunction: any): (...args: any[]) => Promise<{}>;
export declare function hashCode(s: any): number;
export declare function djb2Code(str: any): number;
export declare function sdbmCode(str: any): number;
export declare function loseCode(str: any): number;
export declare function encodeHtmlSpecials(str: any): string;
export declare function createReadStream(object: any, options?: {}): MultiStream;
export declare function readStream(stream: any): Promise<Buffer>;
export interface IMultiStreamOptions {
    highWaterMark?: number;
    encoding?: string;
}
export declare class MultiStream extends Readable {
    _object: any;
    constructor(object: any, options?: IMultiStreamOptions);
    _read(): void;
}
