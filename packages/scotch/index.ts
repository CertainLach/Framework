import ArgParser from '@meteor-it/argv';
import NodeReceiver from '@meteor-it/logger/receivers/node';
import Logger from '@meteor-it/logger';
import path from 'path';
import {exists,readFile} from '@meteor-it/fs';
import yaml from 'js-yaml';
import {sleep} from '@meteor-it/utils';
import {resolve} from 'path';
import * as webpack from 'webpack';
import mkConfig from './parts/all.js';
import {clearScreen,writeStdout} from '@meteor-it/terminal';
import transformErrors from './transformErrors';
import formatErrors from './formatErrors';

import babelSyntaxTransformer from './transformers/babelSyntax';
import moduleNotFoundTransformer from './transformers/moduleNotFound';
import defaultErrorFormatter from './formatters/defaultError';
import moduleNotFoundFormatter from './formatters/moduleNotFound';


Logger.addReceiver(new NodeReceiver(0));

const envTargets = ['production','development','testing'];
const INDIVIDUAL_PROPS=['outputDirectory'];

const parser = new ArgParser('scotch');
const logger = parser.logger;

const MINUS='{red}[-] {/red}'
const PLUS='{green}[+] {/green}'
function flag(...flag){
    return ` [${flag.join('/')}]`.gray;
}
function validateDefaultOrEnvTarget(targetName,config,defaultTarget?){
    logger.ident(targetName);
    let flagPath='envs/'+targetName;
    if(defaultTarget)
        for(let prop in defaultTarget)
            if(!INDIVIDUAL_PROPS.includes(prop))
                config[prop]=defaultTarget[prop];
        
    if(!config.useHash){
        logger.log(`${MINUS}Assuming no hash${flag(flagPath,'useHash')}`);
        config.useHash=false;
    }else{
        logger.log(`${PLUS}${config.useHash?'Using':'Not using'} hash${flag(flagPath,'useHash')}`);
    }
    if(!config.mainChunkName){
        logger.log(`${MINUS}Assuming "main" as main chunk name${flag(flagPath,'mainChunkName')}`);
        config.mainChunkName='main';
    }else{
        logger.log(`${PLUS}Main chunk name is "${config.mainChunkName}"${flag(flagPath,'mainChunkName')}`)
    }
    if(!config.vendorChunkName){
        logger.log(`${MINUS}Assuming "vendor" as vendor chunk name${flag(flagPath,'vendorChunkName')}`);
        config.vendorChunkName='vendor';
    }else{
        logger.log(`${PLUS}Vendor chunk name is "${config.vendorChunkName}"${flag(flagPath,'vendorChunkName')}`)
    }
    if(!config.commonsChunkName){
        logger.log(`${MINUS}Assuming "commons" as commons chunk name${flag(flagPath,'commonsChunkName')}`);
        config.commonsChunkName='commons';
    }else{
        logger.log(`${PLUS}Commons chunk name is "${config.commonsChunkName}"${flag(flagPath,'commonsChunkName')}`)
    }
    if(!config.outputDirectory){
        let outDir=`output/${targetName}/%s`;
        logger.log(`${MINUS}Ensuring "${outDir}" as output directory${flag(flagPath,'outputDirectory')}`);
        config.outputDirectory=outDir;
    }else{
        if(!config.outputDirectory.includes('%s'))
            throw new Error('Output directory template doesn\'t includes %s!')
        logger.log(`${PLUS}Output directory is "${config.outputDirectory}"${flag(flagPath,'outputDirectory')}`)
    }
    logger.deent();
}
function validateCodeTarget(targetName,config){
    logger.ident(targetName);
    let flagPath='targets/'+targetName;
    if(!config.env){
        logger.log(`${MINUS}Assuming "node" env${flag(flagPath,'env')}`);
        config.env='node';
    }else if(!['node','browser','webworker'].includes(config.env)){
        throw new Error(`Unknown env: ${config.env}${flag(flagPath,'env')}\nPossible envs: node, browser, webworker`);
    }else{
        logger.log(`${PLUS}Compiling for "${config.env}"${flag(flagPath,'env')}`);
    }
    if(!config.outTargetName){
        logger.log(`${MINUS}Assuming target name as "${targetName}"${flag(flagPath,'outTargetName')}`);
        config.outTargetName=targetName;
    }else{
        logger.log(`${PLUS}Target name is "${config.outTargetName}"${flag(flagPath,'outTargetName')}`);
    }
    if(!config.entryPoint){
        throw new Error(`No entry point is defined${flag(flagPath,'env')}`)
    }else{
        logger.log(`${PLUS}Entry point is "${config.entryPoint}"${flag(flagPath,'outTargetName')}`);
    }
    logger.deent();
}
function validateConfig(config){
    logger.ident('Validating config');
    logger.ident('Main');
    if(!config.resolveRoots){
        logger.log(`${MINUS}Assuming no addictional module dirs${flag('resolveRoots')}`);
        config.resolveRoots=[];
    }else{
        logger.log(`${PLUS}Added ${config.resolveRoots.length.toString().green} addictionaly module dirs${flag('resolveRoots')}`);
    }
    if(!config.projectName){
        logger.log(`${MINUS}Assuming default project name "Scotch Project"${flag('projectName')}`);
        config.projectName='Scotch Project';
    }else{
        logger.log(`${PLUS}Set project name to "${config.projectName}"${flag('projectName')}`);
    }
    if(!config.overrideModules){
        logger.log(`${MINUS}Assuming no module overrides${flag('overrideModules')}`);
        config.overrideModules={};
    }else{
        logger.log(`${PLUS}Overriding ${Object.keys(config.overrideModules).length.toString().green} module(s)${flag('overrideModules')}`);
    }
    logger.deent();
    logger.ident('Env targets');
    if(!config.envs)
        throw new Error('No "targets" are defined in config!');
    if(config.envs.common===null)
        config.envs.common={};
    if(!config.envs.common){
        logger.log(`${MINUS}No "common" env defined, defining it as empty${flag('envs/common')}`);
        config.envs.common={};
    }
    validateDefaultOrEnvTarget('common',config.envs.common);
    for(let target of envTargets){
        if(config.envs[target]===null)
            config.envs[target]={};
        if(!config.envs[target]){
            logger.log(`${MINUS}No "${target}" env defined, skipping them${flag('envs',target)}`);
            continue;
        }
        validateDefaultOrEnvTarget(target,config.envs[target],config.envs.common);
    }
    logger.deent();
    logger.ident('Code targets');
    for(let targetName of Object.keys(config.targets)){
        validateCodeTarget(targetName,config.targets[targetName]);
    }
    logger.deent();
    logger.deent();
}

async function initAll(){
    logger.ident('Preparing config');
    let cwd=process.cwd();
    let initialCwd=cwd;
    logger.log(`Started`);
    let foundConfig=await exists(path.join(cwd,'scotch.yml'));
    let prevFolder=cwd;
    while(!foundConfig&&cwd!=='.'){
        cwd=path.dirname(cwd);
        if(prevFolder===cwd)
            throw new Error(`Cannot find "scotch.yml" project in ${initialCwd} and in any parent folder!`)
        prevFolder=cwd;
        foundConfig=await exists(path.join(cwd,'scotch.yml'));
    }
    let projectDir=cwd;
    let configPath=path.join(cwd,'scotch.yml');
    logger.log(`Found config`);
    let config={};
    try{
        config=yaml.load((await readFile(configPath)).toString());
    }catch(e){
        throw new Error('"scotch.yml" parsing error!')
    }
    logger.deent();
    validateConfig(config);
    return [config, projectDir];
}

const defaultTransformers = [
  babelSyntaxTransformer,
  moduleNotFoundTransformer
];

const defaultFormatters = [
  defaultErrorFormatter,
  moduleNotFoundFormatter
];

function concat() {
  const args = Array.from(arguments).filter(e => e != null);
  const baseArray = Array.isArray(args[0]) ? args[0] : [args[0]];
  return Array.prototype.concat.apply(baseArray, args.slice(1));
}

function uniqueBy(arr, fun) {
  const seen = {};
  return arr.filter(el => {
    const e = fun(el);
    return !(e in seen) && (seen[e] = 1);
  })
}

function extractErrorsFromStats(stats, type) {
  if (isMultiStats(stats)) {
    const errors = stats.stats
      .reduce((errors, stats) => errors.concat(extractErrorsFromStats(stats, type)), []);
    // Dedupe to avoid showing the same error many times when multiple
    // compilers depend on the same module.
    return uniqueBy(errors, error => error.message);
  }
  return stats.compilation[type];
}

function getCompileTime(stats) {
  if (isMultiStats(stats)) {
    return stats.stats
      .reduce((time, stats) => Math.max(time, getCompileTime(stats)), 0);
  }
  return stats.endTime - stats.startTime;
}

function isMultiStats(stats) {
  return stats.stats;
}

function getMaxSeverityErrors(errors) {
  const maxSeverity = getMaxInt(errors, 'severity');
  return errors.filter(e => e.severity === maxSeverity);
}

function getMaxInt(collection, propertyName) {
  return collection.reduce((res, curr) => {
    return curr[propertyName] > res ? curr[propertyName] : res;
  }, 0)
}

function extractErrorsFromStats(stats, type) {
  if (isMultiStats(stats)) {
    const errors = stats.stats
      .reduce((errors, stats) => errors.concat(extractErrorsFromStats(stats, type)), []);
    // Dedupe to avoid showing the same error many times when multiple
    // compilers depend on the same module.
    return uniqueBy(errors, error => error.message);
  }
  return stats.compilation[type];
}

async function displaySuccess(stats){
    
    const time = getCompileTime(stats);
    logger.log(`${'DONE'.green} Compiled successfully in ${time}ms`)
}
async function displayErrors(errors,severity){
    const processedErrors = transformErrors(errors, defaultTransformers);

    const topErrors = getMaxSeverityErrors(processedErrors);
    const nbErrors = topErrors.length;

    const subtitle = severity === 'error' ?
      `Failed to compile with ${nbErrors} ${severity}s` :
      `Compiled with ${nbErrors} ${severity}s`;
    logger.log(`${'SHIT'.red} ${subtitle}`);

    formatErrors(topErrors, defaultFormatters, severity).forEach(chunk => logger.log(chunk));
}

async function watch(config, projectDir, target, env='none'){
    await validateConfigAgainstArgs(config,target,env);
    logger.log('Starting watcher in '+projectDir);
    if(env!=='none'&&!config.envs[env]){
        throw new Error(`Unknown env: ${env}`);
    }
    logger.ident('Pre start writing config');
    logger.log(`Target:\t\t\t${target.green}`);
    logger.log(`Env:\t\t\t\t${env==='none'?('none (=development)'.red):env.green}`);
    logger.deent();
    //logger.log(`Waiting 3 seconds, because we can`);
    //await sleep(3000);
    logger.log('Constructing webpack config');

    let targetConf=config.targets[target];
    let envConf=config.envs[env==='none'?'development':env];
    global.projectDir=projectDir;
    const compiler = webpack(mkConfig({
        devHost:'TODO',
        publicHost:'TODO',
        env:env==='none'?'development':env,
        for:targetConf.env,
        entryPoint:resolve(projectDir,targetConf.entryPoint),
        resolveRoots:config.resolveRoots.map(root=>resolve(projectDir,root)),
        outTargetName:targetConf.outTargetName,
        useHash:envConf.useHash,
        outputDirPath:resolve(projectDir,envConf.outputDirectory.replace(/%s/g,targetConf.outTargetName)),
        projectBaseDir:projectDir,
        disableChecking:false,
        nodeModules:resolve(projectDir,'node_modules'),
        projectName:config.projectName
    }));

    clearScreen();
    logger.log(`${'WAIT'.green} Compilation in progress`)
    const watching = compiler.watch({
    }, (err, stats) => {
        clearScreen();
        const hasErrors = stats.hasErrors();
      const hasWarnings = stats.hasWarnings();

      if (!hasErrors && !hasWarnings) {
        displaySuccess(stats);
        return;
      }

      if (hasErrors) {
        displayErrors(extractErrorsFromStats(stats, 'errors'), 'error');
        return;
      }

      if (hasWarnings) {
        displayErrors(extractErrorsFromStats(stats, 'warnings'), 'warning');
      }
    });
}

async function validateConfigAgainstArgs(config, target, env){
    logger.ident('Initial checks');
    if(config.targets[target]){
        logger.log(`${PLUS}Target "${target}" found`)
    }else{
        throw new Error(`Target "${target}" is not specified in config!`);
    }
    if(env==='none')
        env='development';
    if(config.envs[env]){
        logger.log(`${PLUS}Env "${env}" found`)
    }else{
        throw new Error(`Env "${env}" is not specified in config!`);
    }
    logger.deent();
}

parser.command('watch')
    .option('target',{
        abbr:'t',
        help:'Defined target to compile and watch',
        required:true
    })
    .option('env',{
        abbr:'e',
        help:'Env to compile with',
        required:false
    })
    .callback(async opts=>{
        try{
            const [config,projectDir]=await initAll();
            await watch(config, projectDir, opts.target, opts.env);
        }catch(e){
            logger.error(e.stack);
        }
    })
    .help('Compile and watch for changes target');

parser.help('Simply compiler based on webpack');
parser.parse();