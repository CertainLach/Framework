import {readFile} from '@meteor-it/fs';
import * as fs from 'fs';
import {resolveFullPath, isNative} from '@meteor-it/require';
import {parse} from 'path';
import {asyncEach} from '@meteor-it/async';
import {flatten, removeDuplicates, mix} from '@meteor-it/utils';
import Logger from '@meteor-it/logger';

const logger = new Logger('scrub');

const REQUIRE_REGEX = /(?:require[^(a-z]*\(\s*(?:'([a-zA-Z.\-/ 1-90]+)'|"([a-zA-Z.\-/ 1-90]+)"|`([a-zA-Z.\-/ 1-90]+)`)\s*\))/g;
const REQUIRE_START_REGEX = /require\s*\(\s*['"`]/;
const REQUIRE_END_REGEX = /['"`]\s*\)/;

const IMPORT_REGEX = /import\s(?:.+\sfrom\s)?['"`][a-z.\-\/]+['"`]/g;
const IMPORT_START_REGEX = /import\s(?:.+\sfrom\s)?['"`]/;
const IMPORT_END_REGEX = /['"`]/;

export const BROWSER_ALTERNATIVES = {
	assert: 'assert',
	console: 'console-browserify',
	constants: 'constants-browserify',
	crypto: 'crypto-browserify',
	domain: 'domain-browser',
	http: 'stream-http',
	https: 'https-browserify',
	os: 'os-browserify/browser.js',
	path: 'path-browserify',
	querystring: 'querystring-es3',
	stream: 'stream-browserify',
	zlib: 'browserify-zlib',
	buffer: 'buffer'
};

function getModuleNameFromRequireCall (call) {
	return call.replace(REQUIRE_START_REGEX, '').replace(REQUIRE_END_REGEX, '');
}
function getModuleNameFromImportCall (call) {
	return call.replace(IMPORT_START_REGEX, '').replace(IMPORT_END_REGEX, '');
}
async function getRequired (moduleSource, fullPath, requiredNeeded = false) {
	let folder = parse(fullPath).dir;
	moduleSource=moduleSource.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
	let requiredNames = [];
	let requires = await asyncEach(
		[...(moduleSource.match(REQUIRE_REGEX) || []).map(getModuleNameFromRequireCall),
		...(moduleSource.match(IMPORT_REGEX) || []).map(getModuleNameFromImportCall)]
		, async (required) => {
		if (requiredNeeded) { requiredNames.push(required); }
		if (isNative(required)) { return required; }
		return await resolveFullPath(required, folder);
	});
	if (!requiredNeeded) { return requires; }
	return mix(requiredNames, requires);
}

async function getDeps (file, parsed = new Set()) {
	if (!parsed.has(file)) { parsed.add(file); }
	if (isNative(file)) { return parsed; }
	//logger.ident(`getRequired(${file})`);
	let required = await getRequired((await readFile(file)).toString(), file);
	//logger.deent();
	let newRequired = required.filter(req => !parsed.has(req));
	required.forEach(req => parsed.add(req));
	//logger.ident(`getDeps(${file})`);
	await asyncEach(newRequired, async req => await getDeps(req, parsed));
	//logger.deent();
	return parsed;
}

export function getBrowserReplacementForNative (native) {
	if (!isNative(native)) { throw new Error(native + ' is not native module!'); }
	if (BROWSER_ALTERNATIVES[native]) { return BROWSER_ALTERNATIVES[native]; }
	throw new Error('No alternatives found for ' + native + '! Replace it with some other module!');
}

export class StandaloneOutput {
	dependencies;
	code;
	constructor (dependencies, code) {
		this.dependencies = dependencies;
		this.code = code;
	}
}

export async function makeStandalone (entryPoint, forBrowser = false, minify = false) {
	logger.debug('Getting deps for %s', entryPoint);
	//logger.ident(`getDeps(${entryPoint})`);
	let deps = Array.from(await getDeps(entryPoint));
	logger.debug('Got deps');
	//logger.deent();
	let requireMap = {};
	if (forBrowser) {
		deps = await asyncEach(deps, async dep => {
			if (isNative(dep)) {
				logger.debug('Searching alternative for %s');
				try {
					requireMap[dep] = await resolveFullPath(getBrowserReplacementForNative(dep), parse(entryPoint).dir);
					return Array.from(await getDeps(getBrowserReplacementForNative(dep)));
				} catch (e) {
					console.error(e);
				}
			}
			return dep;
		});
	}
	logger.debug('Done v0');
	deps = removeDuplicates(flatten(deps));
	let toImport = deps.filter(dep => !isNative(dep));
	logger.debug('Done v1');
	let imported = await asyncEach(toImport, async i => {
		logger.debug('Importing %s', i);
		let content = (await readFile(i)).toString();
		if(i.endsWith('.json'))
			content=`{module.exports=${content}}`;
		let req = await getRequired(content, i, true);
		req.forEach(r => {
			if (!isNative(r[0])) { requireMap[r[0]] = r[1]; }
		});
		return {
			content: content,
			path: i,
			dir: parse(i).dir
		};
	});
	logger.debug('Done v6');
	requireMap[entryPoint] = entryPoint;
	let output = [];
	output.push('var q={};var w={};var e=' + JSON.stringify(requireMap) + ';function z(a){if(!e[a])try{return require(a)}catch(c){throw Error("Module not resolved: "+a);}var b=e[a];if(w[b])return w[b].exports;a={exports:{}};w[b]=a;b=q[b];b[0](a.exports,z,a,b[1],b[2]);return a.exports}function k(a,b,c){q[b]=[a,b,c]};');
	imported.forEach(i => output.push(`k(function(exports,require,module,__filename,__dirname){\n${i.content}\n},'${i.path.replace(/\\/g, '\\\\')}','${i.dir.replace(/\\/g, '\\\\')}')`));
	output.push(`z("${entryPoint.replace(/\\/g, '\\\\')}")`);
	let codeOut = output.join('\n');
	logger.debug('Done v7');
	return new StandaloneOutput(toImport, codeOut);
}