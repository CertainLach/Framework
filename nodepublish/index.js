import ArgvParser from '@meteor-it/argv';
import Logger from '@meteor-it/logger';
import NodeConsoleReceiver from '@meteor-it/logger/receivers/nodeConsole';
import {exec} from '@meteor-it/childProcess';
import {readDir,isDirectory} from '@meteor-it/fs';
import {asyncEach} from '@meteor-it/async';
import {getDeps} from '@meteor-it/scrub'

import {resolve} from 'path';

Logger.addReceiver(new NodeConsoleReceiver());

const publishLogger=new Logger('npublish');

let argParser = new ArgvParser('npublish');
argParser.command('initGit')
    .help('Execute git init (and add remote) in all folders in dir')
    .callback(async res => {
        publishLogger.ident('Initializing git...');
        const rootDir = resolve(process.env.PWD, res.dir);
        publishLogger.log('In %s', rootDir);
        await asyncEach(await readDir(rootDir), async dir => {
            publishLogger.timeStart(dir);
            const path=resolve(rootDir,dir);
            publishLogger.log('Full path: %s',path);
            if(!await isDirectory(path)){
                publishLogger.err('%s is not a directory!',dir);
                publishLogger.timeEnd(dir);
                return;
            }
            if(!res.force)
                if(await isDirectory(resolve(path,'.git'))){
                    publishLogger.err('Git repo already initialized in "%s"! Use --force to override!',dir);
                    publishLogger.timeEnd(dir);
                    return;
                }
            let formatted=res.gitRepoFormat.replace('{repo}',dir);
            if(res.gitRepoFormat===formatted){
                publishLogger.err('No {repo} is found in gitRepoFormat!');
                publishLogger.timeEnd(dir);
                return;
            }
            const logsInit=await exec('git init',{cwd:path});
            logLogs(logsInit);
            publishLogger.log('Git init done in %s',dir);
            try{
                const logsRemote=await exec('git remote add origin '+formatted,{cwd:path});
                logLogs(logsRemote);
                publishLogger.log('Git remote done in %s',dir);
            }catch(e){
                publishLogger.err('Cannot add origin:');
                errLog(e.message);
            }
            publishLogger.timeEnd(dir);
        });
        publishLogger.deent();
    })
    .option('dir', {
        required: true,
        help: 'Dir with all packages'
    })
    .option('gitRepoFormat', {
        required:true,
        help: 'Git repo url, i.e: "git@github.com:Creeplays/{repo}.git". {repo} will be replaced with folder name'
    })
    .option('force',{
        abbr:'f',
        flag:true,
        default:false,
        help: 'Override .git'
    });
argParser.command('npm init')
    .help('Execute git init (and add remote) in all folders in dir')
    .callback(async res => {
        
    })
    .option('dir', {
        required: true,
        help: 'Dir with all packages'
    })
argParser.parse();

function logLog(log) {
    log.split('\n').filter(l=>l!=='').forEach(str=>publishLogger.log(str));
}
function errLog(log) {
    log.split('\n').filter(l=>l!=='').forEach(str=>publishLogger.err(str));
}
function logLogs(logs) {
    logLog(logs.stdout);
    errLog(logs.stderr);
}