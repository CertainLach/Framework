import fsNative, { Stats } from 'fs';
import path from 'path';
import { asyncEach } from '@meteor-it/utils';

const { promises: fs, constants: fsConstants, createReadStream, createWriteStream } = fsNative;
const { sep } = path;
type FileHandle = fsNative.promises.FileHandle;
/**
 * Returns true if path is a valid data url
 * @param path path
 */
function isDataUrl(path: string): boolean {
	return /^data:.+\/.+;base64,/.test(path.substr(0, 268))
}

export interface IParsedDataUrl {
	mime: string,
	data: Buffer
}
/**
 * Returns mime and data of dataurl
 * @param path Data url
 */
function parseDataUrl(path: string): IParsedDataUrl {
	return {
		mime: path.slice(5, path.indexOf(';')),
		data: Buffer.from(path.slice(path.indexOf(',') + 1), 'base64')
	}
}

/**
 * Get all files in directory
 */
export async function readDir(dir: string) {
	return await fs.readdir(dir);
}
/**
 * Read file or parse data url
 * @param file Path to file to read
 */
export async function readFile(file: string): Promise<Buffer> {
	if (isDataUrl(file))
		return parseDataUrl(file).data;
	return await fs.readFile(file);
}

export async function stat(file: string): Promise<Stats> {
	return await fs.stat(file);
}

export async function open(file: string, mode: string, access: string): Promise<FileHandle> {
	return await fs.open(file, mode, access);
}

export async function read(fd: FileHandle, buffer: Buffer, offset: number, length: number, position: number) {
	return await fs.read(fd, buffer, offset, length, position);
}

/**
 * Write text to file
 */
export async function writeFile(filename: string, text: string | Buffer) {
	return await fs.writeFile(filename, text);
}

/**
 * Walk directory
 * @param dir Directory to walk
 * @param cb If provided, found files will returned realtime. If not - function will return all found files
 */
export async function walkDir(dir: string, cb?: (file: string, dir: string) => void): Promise<string[] | null> {
	if (!await exists(dir)) { throw new Error('No such file or directory: ' + dir); }
	let returnValue: string[];
	let shouldReturn = false;
	if (!cb) {
		returnValue = [];
		shouldReturn = true;
		cb = (file: string, dir: string) => {
			returnValue.push(dir + sep + file);
		};
	}
	let dirList: string[] = [];
	await asyncEach(await readDir(dir), async (file: string) => {
		let path = dir + sep + file;
		if (await isFile(path)) {
			cb(file, dir);
		} else if (await isDirectory(path)) {
			dirList.push(file);
		}
	});
	await asyncEach(dirList, async (dirLevelDown: string) => {
		await walkDir(dir + sep + dirLevelDown, cb);
	});
	if (shouldReturn) {
		return returnValue.sort();
	}
	return null;
}

/**
 * Check if file exists
 */
export async function exists(file: string): Promise<boolean> {
	try {
		let result = await fs.access(file, fsConstants.F_OK);
		return result === undefined;
	} catch (e) {
		// Because only "err" field is returned if not exists
		return false;
	}
}

/**
 * Is path a file
 * @param path path to test
 */
export async function isFile(path: string): Promise<boolean> {
	return (await stat(path)).isFile();
}
/**
 * Is path a directory
 */
export async function isDirectory(path: string): Promise<boolean> {
	return (await stat(path)).isDirectory();
}

/**
 * Wrapper to fs function
 */
export function getReadStream(path: string, options = {}) {
	return createReadStream(path, options);
}

/**
 * Wrapper to fs function
 */
export function getWriteStream(path: string, options = {}) {
	return createWriteStream(path, options);
}
