import { asyncEach, collectCallbacks } from '@meteor-it/utils';
import { constants } from 'fs';
import { access, copyFile, mkdir, readdir, stat } from 'fs/promises';
import * as path from 'path';

type IWalkOptions = {
	filter?: (name: string) => boolean;
}

export async function copyWalk(from: string, to: string, options?: IWalkOptions) {
	from = path.resolve(from);
	to = path.resolve(to);
	if ((await isDirectory(from))) {
		const dirStruct = (await walkDirStructArray(from)).map(e => e.replace(from, to));
		try {
			await asyncEach(dirStruct, dir => mkdir(dir, { recursive: true }));
		} catch (e) { }
		try {
			await asyncEach(await walkDirArray(from), f => options && options.filter && !options.filter(f) && Promise.resolve(true) as any as Promise<void> || copyWalk(f, f.replace(from, to)));
		} catch (e: any) {
			if (e?.code !== 'ENOENT') throw e;
		}
		return;
	}
	await copyFile(from, to);
}

export function walkDirArray(dir: string, options?: IWalkOptions): Promise<string[]> {
	return collectCallbacks(collector => walkDir(dir, collector, options));
}

/**
 * Walk directory
 * @param dir directory to walk
 * @param cb found files will returned realtime
 */
export async function walkDir(dir: string, cb?: (file: string) => void, options?: IWalkOptions): Promise<void> {
	if (!await exists(dir)) { throw new Error('no such file or directory: ' + dir); }
	let dirList: string[] = [];
	await asyncEach(await readdir(dir), async (file: string) => {
		let pathStr = dir + path.sep + file;
		if (await isFile(pathStr)) {
			if (options?.filter && !options.filter(pathStr)) return;
			cb?.(pathStr);
		} else if (await isDirectory(pathStr)) {
			dirList.push(file);
		}
	});
	await asyncEach(dirList, async (dirLevelDown: string) => {
		await walkDir(dir + path.sep + dirLevelDown, cb, options);
	});
}

export function walkDirStructArray(dir: string, options?: IWalkOptions): Promise<string[]> {
	return collectCallbacks(collector => walkDirStruct(dir, collector, options));
}

export async function walkDirStruct(dir: string, cb: (dir: string) => void, options?: IWalkOptions): Promise<void> {
	if (!await exists(dir)) { throw new Error('no such file or directory: ' + dir); }
	let dirList: string[] = [];
	await asyncEach(await readdir(dir), async (file: string) => {
		let pathStr = path.resolve(dir, file);
		if (await isDirectory(pathStr)) {
			dirList.push(pathStr);
		}
	});
	await asyncEach(dirList, async (dirLevelDown: string) => {
		const dirPath = path.resolve(dir, dirLevelDown);
		await walkDirStruct(dirPath, cb, options);
		if (options?.filter && !options.filter(dirPath)) return;
		cb?.(dirPath);
	});
}

/**
 * Check if file exists
 */
export async function exists(file: string): Promise<boolean> {
	try {
		let result = await access(file, constants.F_OK);
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
