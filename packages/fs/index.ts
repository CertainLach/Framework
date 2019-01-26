import fsNative, { Stats } from 'fs';
import path from 'path';
import { asyncEach } from '@meteor-it/utils';

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
	return await fsNative.promises.readdir(dir);
}
/**
 * Read file or parse data url
 * @param file Path to file to read
 */
export async function readFile(file: string): Promise<Buffer> {
	if (isDataUrl(file))
		return parseDataUrl(file).data;
	return await fsNative.promises.readFile(file);
}

export async function stat(file: string): Promise<Stats> {
	return await fsNative.promises.stat(file);
}

export async function open(file: string, mode: string, access: string): Promise<FileHandle> {
	return await fsNative.promises.open(file, mode, access);
}

export async function read(fd: FileHandle, buffer: Buffer, offset: number, length: number, position: number) {
	return await fsNative.promises.read(fd, buffer, offset, length, position);
}

type IWalkOptions = {
	filter?: (name: string) => boolean;
}

export async function copy(from: string, to: string, options?: IWalkOptions) {
	from = path.resolve(from);
	to = path.resolve(to);
	console.log(from, to);
	if ((await isDirectory(from))) {
		const dirStruct = (await walkDirStruct(from)).map(e => e.replace(from, to));
		await asyncEach(dirStruct, dir => mkdir(dir, true));
		await asyncEach(await walkDir(from), f => options && options.filter && !options.filter(f) && Promise.resolve(true) as any as Promise<void> || copy(f, f.replace(from, to)));
		return;
	}
	await fsNative.promises.copyFile(from, to);
}

export async function mkdir(pathStr: string, recursive: boolean = false): Promise<void> {
	pathStr = path.resolve(pathStr);
	if (recursive) {
		// TODO: there is recursive option in new versions of node.js,
		// check for availability of them
		try {
			return await mkdir(pathStr);
		} catch (e) {
			if (e.code === 'ENOENT') {
				await mkdir(path.dirname(pathStr), true);
				return await mkdir(pathStr);
			} else if (!(await exists(pathStr))) {
				throw e;
			} else {
				// Success
				return;
			}
		}
	} else {
		return await fsNative.promises.mkdir(pathStr);
	}
}

async function unlinkDirectoryStructure(pathStr: string) {
	pathStr = path.resolve(pathStr);
	const dirs = await readDir(pathStr);
	await asyncEach(dirs, async dir => {
		const dirPath = path.resolve(pathStr, dir);
		await unlinkDirectoryStructure(dirPath);
		await unlink(dirPath);
	});
}
export async function unlink(pathStr: string, recursive: boolean = false, options?: IWalkOptions) {
	pathStr = path.resolve(pathStr);
	if (recursive) {
		// Empty all dirs
		await walkDir(pathStr, options).then(files => Promise.all(files.map((n) => unlink(n))));
		await unlinkDirectoryStructure(pathStr);
	} else {
		if (await isDirectory(pathStr)) {
			return await fsNative.promises.rmdir(pathStr);
		}
		await fsNative.promises.unlink(pathStr);
	}
}

/**
 * Write text to file
 */
export async function writeFile(filename: string, text: string | Buffer) {
	return await fsNative.promises.writeFile(filename, text);
}

/**
 * Walk directory
 * @param dir Directory to walk
 * @param cb If provided, found files will returned realtime. If not - function will return all found files
 */
export async function walkDir(dir: string, options?: IWalkOptions, cb?: (file: string) => void): Promise<string[] | null> {
	if (!await exists(dir)) { throw new Error('No such file or directory: ' + dir); }
	let returnValue: string[];
	let shouldReturn = false;
	if (!cb) {
		returnValue = [];
		shouldReturn = true;
		cb = (file: string) => {
			returnValue.push(path.resolve(dir, file));
		};
	}
	let dirList: string[] = [];
	await asyncEach(await readDir(dir), async (file: string) => {
		let pathStr = dir + path.sep + file;
		if (await isFile(pathStr)) {
			if (options && options.filter && !options.filter(pathStr)) return;
			cb(pathStr);
		} else if (await isDirectory(pathStr)) {
			dirList.push(file);
		}
	});
	await asyncEach(dirList, async (dirLevelDown: string) => {
		await walkDir(dir + path.sep + dirLevelDown, options, cb);
	});
	if (shouldReturn) {
		return returnValue.sort();
	}
	return null;
}

export async function walkDirStruct(dir: string, options?: IWalkOptions, cb?: (dir: string) => void): Promise<string[] | null> {
	if (!await exists(dir)) { throw new Error('No such file or directory: ' + dir); }
	let returnValue: string[];
	let shouldReturn = false;
	if (!cb) {
		returnValue = [];
		shouldReturn = true;
		cb = (dir: string) => {
			returnValue.push(dir);
		};
	}
	let dirList: string[] = [];
	await asyncEach(await readDir(dir), async (file: string) => {
		let pathStr = path.resolve(dir, file);
		if (await isDirectory(pathStr)) {
			dirList.push(pathStr);
		}
	});
	await asyncEach(dirList, async (dirLevelDown: string) => {
		const dirPath = path.resolve(dir, dirLevelDown);
		await walkDirStruct(dirPath, options, cb);
		if (options && options.filter && !options.filter(dirPath)) return;
		cb(dirPath);
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
		let result = await fsNative.promises.access(file, fsNative.constants.F_OK);
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
	return fsNative.createReadStream(path, options);
}

/**
 * Wrapper to fs function
 */
export function getWriteStream(path: string, options = {}) {
	return fsNative.createWriteStream(path, options);
}
