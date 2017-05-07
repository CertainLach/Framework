import {readFile, exists, isFile} from '@meteor-it/fs';
import {resolve, sep as fsSeparator} from 'path'; // TODO add this features to filesystem module
import Logger from '@meteor-it/logger';

const resolveLogger = new Logger('resolve');

/**
 * Default node modules
 */
export const CORE_MODULES = [
	'assert',
	'buffer_ieee754',
	'buffer',
	'child_process',
	'cluster',
	'console',
	'constants',
	'crypto',
	'_debugger',
	'dgram',
	'dns',
	'domain',
	'events',
	'freelist',
	'fs',
	'http',
	'https',
	'_linklist',
	'module',
	'net',
	'os',
	'path',
	'punycode',
	'querystring',
	'readline',
	'repl',
	'stream',
	'string_decoder',
	'sys',
	'timers',
	'tls',
	'tty',
	'url',
	'util',
	'vm',
	'zlib',
	'_http_server',
	'process',
	'v8'
];
async function loadAsFile (path) {
	resolveLogger.debug('Trying to load as file... (%s)', path);
    // 1
	if (await exists(path)) {
		if (await isFile(path))	{ return path; }
	}
    // 2
	if (await exists(path + '.js')) {
		if (await isFile(path + '.js'))	{ return path + '.js'; }
	}
    // 3
	if (await exists(path + '.json')) {
		if (await isFile(path + '.json'))	{ return path + '.json'; }
	}
    // 4
	if (await exists(path + '.node')) {
		if (await isFile(path + '.node'))	{ return path + '.node'; }
	}
	return null;
}
async function loadAsDir (path) {
	resolveLogger.debug('Trying to load as dir... (%s)', path);
    // 1
	if (await exists(resolve(path, 'package.json'))) {
        // a
		let packageJson = await readFile(resolve(path, 'package.json'));
		let mainField;
		let obj = JSON.parse(packageJson.toString());
		if (obj.main) { mainField = obj.main; }
		if (mainField) {
			let asFile= await loadAsFile(resolve(path, mainField));
			if(asFile)
				return asFile;
			let asDir=await loadAsDir(resolve(path,mainField));
			if(asDir)
				return asDir;
			throw new Error('Wrong main file in package.json at '+path);
		}
	}
    // 2
	if (await exists(resolve(path, 'index.js'))) {
		if (await isFile(resolve(path, 'index.js')))	{ return resolve(path, 'index.js'); }
	}
    // 3
	if (await exists(resolve(path, 'index.json'))) {
		if (await isFile(resolve(path, 'index.json')))	{ return resolve(path, 'index.json'); }
	}
    // 4
	if (await exists(resolve(path, 'index.node'))) {
		if (await isFile(resolve(path, 'index.node')))	{ return resolve(path, 'index.node'); }
	}
	return null;
}
async function getNodeModulesPaths (from) {
    // 1
	let parts = from.split(fsSeparator);
    // 2
	let i = parts.length - 1;
    // 3
	let dirs = [];
    // 4
	while (i >= 0) {
        // a (Escape from standarts! resolve outer modules (ex: /node_modules/a from /node_modules/b) in way, that not exists in native node)
		// if (parts[i] === 'node_modules') {
		// 	i--;
		// 	continue;
		// }
        // b
		let dir = resolve(parts.slice(0, i).join(fsSeparator), 'node_modules');
        // c
		dirs.push(dir);
        // d
		i--;
	}
	// console.log(dirs);
	return dirs;
}
async function loadNodeModules (module, from) {
	resolveLogger.debug('Trying to load... (%s from %s)', module, from);
    // 1
	let dirs = await getNodeModulesPaths(from);
    // 2
	for (let dir of dirs) {
		resolveLogger.debug('Using %s as module storage...', dir);
        // a
		let file = await loadAsFile(resolve(dir, module));
		if (file) { return file; }
        // b
		let directory = await loadAsDir(resolve(dir, module));
		if (directory) { return directory; }
	}
	return null;
}
/**
 * Same as require.resolve, but async and you can select dir to search from
 */
export async function resolveFullPath (module, from) {
	resolveLogger.debug('Started resolving '+module+' from '+from);
    // 1
	if (isNative(module)) {
		return module;
	}
    // 2
	if (module.startsWith('./') || module.startsWith('../') || module.startsWith('/')) {
        // a
		let file = await loadAsFile(resolve(from, module));
		if (file) return file;
        // b
		let dir = await loadAsDir(resolve(from, module));
		if (dir) return dir;
	}
    // 3
	let nodeModules = await loadNodeModules(module, from);
	if (nodeModules) return nodeModules;
    // 4
	throw new Error('Module not found: ' + module + ' (searching from ' + from + ')');
}
/**
 * Return true if module exists in node.js core modules list
 */
export function isNative (module) {
	return (~CORE_MODULES.indexOf(module))||module.endsWith('.node')||module.endsWith('config.js')||module.endsWith('config.json');
}
