/// <reference types="node" />
import * as fs from 'fs';
/**
 * Get all files in directory
 */
export declare function readDir(dir: any): Promise<string[]>;
/**
 * Read file
 * @param file Path to file to read
 */
export declare function readFile(file: any): Promise<Buffer>;
export declare function stat(file: any): Promise<fs.Stats>;
export declare function open(file: any, mode: any, access: any): Promise<number>;
export declare function read(fd: any, buffer: any, offset: any, length: any, position: any): Promise<{
    bytesRead: number;
    buffer: any;
}>;
export declare function close(fd: any): Promise<void>;
/**
 * Write text to file
 */
export declare function writeFile(filename: any, text: any): Promise<void>;
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
 */
export declare function isFile(path: any): Promise<boolean>;
/**
 * Is path a directory
 */
export declare function isDirectory(path: any): Promise<boolean>;
/**
 * Wrapper to fs function
 */
export declare function getReadStream(path: any, options?: {}): fs.ReadStream;
/**
 * Wrapper to fs function
 */
export declare function getWriteStream(path: any, options?: {}): fs.WriteStream;
