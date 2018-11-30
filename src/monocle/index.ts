import Argv from '@meteor-it/argv';
import {readDir, read} from '@meteor-it/fs';
import Logger from '@meteor-it/logger';
import NodeReceiver from '@meteor-it/logger/receivers/node';
import {asyncEach,readStreamToBuffer} from '@meteor-it/utils';
import {join} from 'path';
import {promisify} from 'util';
import {exec} from 'child_process';

const execAsync = promisify(exec);

Logger.addReceiver(new NodeReceiver());

async function executeCommand(cmd:string,cwd:string):Promise<string>{
    const{stderr,stdout} = await execAsync(cmd,{cwd});
    if(stderr!=='')throw new Error(stderr);
    return stdout;
}
async function listPackages():Promise<string[]>{
    return await readDir(join(process.cwd(),'packages'));
}
async function isUpdated(pckg:string):Promise<boolean>{
    const res = await executeCommand(`git diff ${join(process.cwd(),'packages',pckg)}`,join(process.cwd(),'packages',pckg));
    if(res.trim()==='')
        return false;
    return true;
}

const argv = new Argv('monocle');
const logger = argv.logger;
argv.command('updated')
    .help('List updated packages')
    .callback(async()=>{
        logger.log('Checking updates');
        await asyncEach(await listPackages(),async (p)=>{
            logger.log(`{green}${p}{/green}: ${await isUpdated(p)}`);
        });
    });
argv.parse();