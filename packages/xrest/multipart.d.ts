/// <reference types="node" />
import { Readable as ReadableStream, Writable as WritableStream } from 'stream';
export declare const DEFAULT_BOUNDARY = "84921024METEORITXREST74819204";
export declare class File {
    path: string;
    filename: string;
    fileSize: number;
    encoding: string;
    contentType: string;
    constructor(path: string, filename: string | null, fileSize: number, encoding?: string, contentType?: string);
}
export declare class FileStream {
    filename: string;
    fileSize: number;
    encoding: string;
    contentType: string;
    stream: ReadableStream;
    constructor(stream: ReadableStream, filename: string, dataLength: number, encoding?: string, contentType?: string);
}
export declare type IPartData = File | FileStream | number | string;
export declare class Part {
    name: string;
    value: File | FileStream | number | string;
    boundary: string;
    constructor(name: string, value: IPartData, boundary: string);
    header(): string;
    sizeOf(): number;
    write(stream: WritableStream): Promise<void>;
}
export declare type IMultiPartData = {
    [key: string]: IPartData;
};
export declare class MultiPartRequest {
    encoding: string;
    boundary: string;
    data: IMultiPartData;
    private _partNames;
    constructor(encoding: string, data: IMultiPartData, boundary?: string);
    readonly partNames: string[];
    private writePart(stream, partCount?);
    write(stream: WritableStream): Promise<void>;
}
export declare function sizeOf(parts: IMultiPartData, boundary?: string): number;
export declare function write(encoding: string, stream: WritableStream, data: IMultiPartData, boundary?: string): Promise<MultiPartRequest>;
