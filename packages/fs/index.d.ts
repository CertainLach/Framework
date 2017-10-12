/// <reference types="node" />
import * as fs from 'fs';
export interface IParsedDataUrl {
    mime: string;
    data: Buffer;
}
/**
 * Get all files in directory
 */
export declare function readDir(dir: any): Promise<any>;
/**
 * Read file or parse data url
 * @param file Path to file to read
 */
export declare function readFile(file: string): Promise<Buffer>;
export declare function stat(file: any): Promise<any>;
export declare function open(file: any, mode: any, access: any): Promise<any>;
export declare function read(fd: any, buffer: any, offset: any, length: any, position: any): Promise<any>;
export declare function close(fd: any): Promise<any>;
/**
 * Write text to file
 */
export declare function writeFile(filename: string, text: string | Buffer): Promise<any>;
/**
 * Walk directory
 * @param dir Directory to walk
 * @param cb If provided, found files will returned realtime. If not - function will return all found files
 */
export declare function walkDir(dir: any, cb?: any): Promise<any>;
/**
 * Check if file exists
 */
export declare function exists(file: any): Promise<boolean>;
/**
 * Is path a file
 * @param path path to test
 */
export declare function isFile(path: string): Promise<boolean>;
/**
 * Is path a directory
 */
export declare function isDirectory(path: string): Promise<boolean>;
/**
 * Wrapper to fs function
 */
export declare function getReadStream(path: string, options?: {}): fs.ReadStream;
/**
 * Wrapper to fs function
 */
export declare function getWriteStream(path: string, options?: {}): fs.WriteStream;
