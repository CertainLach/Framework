import Logger from '@meteor-it/logger';
import Receiver from '@meteor-it/logger-receiver-node-console';
import DepGraph from './graph.js';
import {resolveFullPath, isNative} from '@meteor-it/require';
import {watch} from 'chokidar';
import {asyncEach} from '@meteor-it/async';
import {parse,resolve} from 'path';
import {readFile,walkDir} from '@meteor-it/fs';
import {mix} from '@meteor-it/utils';

Logger.addReceiver(new Receiver());

const CLASSIC_EXTENSIONS=['node','js','css'];

const REQUIRE_REGEX = /(?:require[^(a-z]*\(\s*(?:'([a-zA-Z.\-/ 1-90]+)'|"([a-zA-Z.\-/ 1-90]+)"|`([a-zA-Z.\-/ 1-90]+)`)\s*\))/g;
const REQUIRE_START_REGEX = /require\s*\(\s*['"`]/;
const REQUIRE_END_REGEX = /['"`]\s*\)/;
const IMPORT_REGEX = /import\s(?:.+\sfrom\s)?['"`][a-z.\-\/]+['"`]/g;
const IMPORT_START_REGEX = /import\s(?:.+\sfrom\s)?['"`]/;
const IMPORT_END_REGEX = /['"`]/;

function getModuleNameFromRequireCall (call) {
	return call.replace(REQUIRE_START_REGEX, '').replace(REQUIRE_END_REGEX, '');
}
function getModuleNameFromImportCall (call) {
	return call.replace(IMPORT_START_REGEX, '').replace(IMPORT_END_REGEX, '');
}
async function getRequired (moduleSource, fullPath) {
	let folder = parse(fullPath).dir;
	moduleSource=moduleSource.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
	let requiredNames = [];
	let requires = await asyncEach(
		[...(moduleSource.match(REQUIRE_REGEX) || []).map(getModuleNameFromRequireCall),
		...(moduleSource.match(IMPORT_REGEX) || []).map(getModuleNameFromImportCall)]
		, async (required) => {
		requiredNames.push(required);
		if (isNative(required)) { return required; }
		return await resolveFullPath(required, folder);
	});
	return mix(requiredNames,requires);
};

const logger=new Logger('scotch');
function getExt(path){
    let spl=path.split('.');
    return spl[spl.length-1];
}
const CLASSIC_COMPILER={
    compiler:{
        js:{
            async compile(module,deps){
                
            }
        }
    },
    findDependentsOf:{
        async js(file,path){
            return await getRequired(file.toString(),path);
        }
    },
    saveDepsInFile:{
        async js(deps,fileContent){
            Object.keys(deps).forEach(from=>{
                fileContent=fileContent.split(`require('${from}')`).join(`require('${deps[from]}')`).split(`require("${from}")`).join(`require('${deps[from]}')`);
            });
            return fileContent;
        }
    }
}

class EntryPoint{
    
    
    constructor(filePath){
        
    }
}

async function unify(filePath){
    let result={
        realName:filePath,
        content:'',
        deps:{}
    }
    result.content=(await readFile(filePath)).toString();
    //Compile to classic language, change realName
    if(CLASSIC_EXTENSIONS.indexOf(getExt(filePath))===-1){
        throw new Error('TODO');
    }
    let ext=getExt(result.realName);
    let deps=await CLASSIC_COMPILER.findDependentsOf[ext](result.content,result.realName);
    result.deps=deps;
    result.content=await CLASSIC_COMPILER.saveDepsInFile[ext](deps,result.content);
    return result;
}
async function processDeps(deps,unified) {
    let res=Object.values(unified.deps).filter(d=>!deps.hasNode(d));
    logger.log('Unprocessed deps = ',res.length);
}

async function initialProcessEntryPoint(file) {
    const deps=new DepGraph();
    deps.addNode(file);
    let fullPath=resolve(process.cwd(),file);
    logger.log('Processing %s',fullPath);
    let unified=await unify(fullPath);
    logger.log('Real name = '+unified.realName);
    logger.log('Has '+Object.values(unified.deps).length+' deps, processing them'); 
    await processDeps(deps,unified);
    
}

async function startScotch(config) {
    logger.log('Building dep tree');
    for(let file of Object.keys(config.entryPoints)){
        await initialProcessEntryPoint(file);
        //console.log(unified);
    }
}

startScotch({
    compiler:{
        ts:{
            to:'js',
            async compile(module,deps){
                
            }
        }
    },
    findDependentsOf:{
        async js:(file)=>{
            
        }
    },
    entryPoints:{
        '../ayzek/index.js':'./a.js'
    }
})