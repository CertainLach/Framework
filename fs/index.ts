import * as fs from 'fs';
import {asyncEach} from '@meteor-it/utils';
import {sep} from 'path';
import {promisify} from 'util';

/**
 * Get all files in directory
 */
export async function readDir (dir) {
	return await promisify(fs.readdir)(dir);
}
/**
 * Read file
 * @param file Path to file to read
 */
export async function readFile (file) {
	return await promisify(fs.readFile)(file);
}

export async function stat (file) {
	return await promisify(fs.stat)(file);
}

export async function open (file,mode,access){
	return await promisify(fs.open)(file,mode,access);
}

export async function read(fd, size, position, encoding){
	return await promisify(fs.read)(fd,size,position,encoding);
}

export async function close(fd){
	return await promisify(fs.close)(fd);
}

/**
 * Write text to file
 */
export async function writeFile (filename, text) {
	return await promisify(fs.writeFile)(filename, text);
}

/**
 * Walk directory
 * @param dir Directory to walk
 * @param cb If provided, found files will returned realtime. If not - function will return all found files
 */
export async function walkDir (dir, cb) {
	if (!await exists(dir)) { throw new Error('No such file or directory: ' + dir); }
	let returnValue;
	let shouldReturn = false;
	if (!cb) {
		returnValue = [];
		shouldReturn = true;
		cb = (file, dir) => {
			returnValue.push(dir + sep + file);
		};
	}
	let dirList = [];
	await asyncEach(await readDir(dir), async(file) => {
		let path = dir + sep + file;
		if (await isFile(path)) {
			cb(file, dir);
		} else if (await isDirectory(path)) {
			dirList.push(file);
		}
	});
	await asyncEach(dirList, async(dirLevelDown) => {
		await walkDir(dir + sep + dirLevelDown, cb);
	});
	if (shouldReturn) {
	    return returnValue.sort();
	}
	return;
}

/**
 * Check if file exists
 */
export async function exists (file) {
	try {
		let result = await promisify(fs.access)(file, fs.constants.F_OK);
		if (result === undefined) {
		    return true;
		}
		// Because only "err" field is returned if not exists
	} catch (e) {
		return false;
	}
}

/**
 * Is path a file
 */
export async function isFile (path) {
	return (await stat(path)).isFile();
}
/**
 * Is path a directory
 */
export async function isDirectory (path) {
	return (await stat(path)).isDirectory();
}

/**
 * Wrapper to fs function
 */
export function getReadStream (path, options) {
	return fs.createReadStream(path, options);
}

/**
 * Wrapper to fs function
 */
export function getWriteStream (path, options) {
	return fs.createWriteStream(path, options);
}
