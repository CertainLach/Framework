/// <reference types="node" />
import * as fs from 'fs';
export interface IParsedDataUrl {
    mime: string;
    data: Buffer;
}
/**
 * Get all files in directory
 */
export declare function readDir(dir: string): Promise<string[]>;
/**
 * Read file or parse data url
 * @param file Path to file to read
 */
export declare function readFile(file: string): Promise<Buffer>;
export declare function stat(file: string): Promise<fs.Stats>;
export declare function open(file: string, mode: string, access: string): Promise<number>;
export declare function read(fd: number, buffer: Buffer, offset: number, length: number, position: number): Promise<{
    bytesRead: number;
    buffer: Buffer;
}>;
export declare function close(fd: number): Promise<void>;
/**
 * Write text to file
 */
export declare function writeFile(filename: string, text: string | Buffer): Promise<void>;
/**
 * Walk directory
 * @param dir Directory to walk
 * @param cb If provided, found files will returned realtime. If not - function will return all found files
 */
export declare function walkDir(dir: string, cb?: (file: string, dir: string) => void): Promise<string[] | null>;
/**
 * Check if file exists
 */
export declare function exists(file: string): Promise<boolean>;
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
