/// <reference types="node" />
import * as fs from 'fs';
export interface IParsedDataUrl {
    mime: string;
    data: Buffer;
}
export declare function readDir(dir: any): Promise<any>;
export declare function readFile(file: string): Promise<Buffer>;
export declare function stat(file: any): Promise<any>;
export declare function open(file: any, mode: any, access: any): Promise<any>;
export declare function read(fd: any, buffer: any, offset: any, length: any, position: any): Promise<any>;
export declare function close(fd: any): Promise<any>;
export declare function writeFile(filename: string, text: string | Buffer): Promise<any>;
export declare function walkDir(dir: any, cb?: any): Promise<any>;
export declare function exists(file: any): Promise<boolean>;
export declare function isFile(path: string): Promise<boolean>;
export declare function isDirectory(path: string): Promise<boolean>;
export declare function getReadStream(path: string, options?: {}): fs.ReadStream;
export declare function getWriteStream(path: string, options?: {}): fs.WriteStream;
