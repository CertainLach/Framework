/// <reference types="node" />
import { Readable as ReadableStream } from 'stream';
export declare const DEFAULT_BOUNDARY = "84921024METEORITXREST74819204";
export declare class Stream {
    stream: any;
    string: any;
    constructor(stream: any);
    write(data: any): void;
    _isString(obj: any): boolean;
}
export declare class File {
    path: any;
    filename: any;
    fileSize: any;
    encoding: any;
    contentType: any;
    constructor(path: any, filename: any, fileSize: any, encoding: any, contentType: any);
}
export declare class FileStream {
    filename: any;
    fileSize: any;
    encoding: any;
    contentType: any;
    stream: ReadableStream;
    constructor(stream: ReadableStream, filename: string, dataLength: number, encoding?: string, contentType?: string);
}
export declare class Data extends FileStream {
    constructor(filename: string, contentType: string, data: any);
}
export declare class Part {
    name: any;
    value: any;
    boundary: any;
    constructor(name: any, value: any, boundary: any);
    header(): string;
    sizeOf(): any;
    write(stream: any): Promise<{}>;
}
export declare class MultiPartRequest {
    encoding: any;
    boundary: any;
    data: any;
    partNames: any;
    constructor(data: any, boundary: any);
    _partNames(): any[];
    write(stream: any): Promise<any>;
}
export declare function sizeOf(parts: any, boundary?: string): number;
export declare function write(stream: any, data: any, callback: any, boundary?: string): Promise<MultiPartRequest>;
