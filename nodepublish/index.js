import ArgvParser from '@meteor-it/argv';
import Logger from '@meteor-it/logger';
import {readDir,isDirectory,exists,writeFile} from '@meteor-it/fs';
import {asyncEach} from '@meteor-it/utils-common';
import AJSON from '@meteor-it/ajson';
import * as licenses from './licenses.json';

import {resolve} from 'path';


const publishLogger=new Logger('npublish');

let argParser = new ArgvParser('npublish');


argParser.command('msc-init')
    .help('Create multiscotch files in every package dir')
    .callback(async res => {
        if(!licenses[res.license])
            return publishLogger.error('Wrong license name! Possible licenses: '+Object.keys(licenses));
        publishLogger.ident('Initializing npm...');
        const rootDir = resolve(process.env.PWD, res.dir);
        publishLogger.log('In %s', rootDir);
        await asyncEach(await readDir(rootDir),async dir=>{
            publishLogger.log('Started initializing %s...',dir);  
            let fullPath=resolve(rootDir,dir);
            if(!await isDirectory(fullPath))
                return publishLogger.warn('%s is not a directory! Skipping.',dir);
            let packageJson=resolve(fullPath,'package.json');
            if(await exists(packageJson))
                return publishLogger.warn('%s is already initialized, skipping.',dir);
            await writeFile(packageJson,AJSON.stringify({
                "name": `${res.namespace}/${dir}`,
                "version": res.defaultVersion,
                "description": res.defaultDescription,
                "main": "index.js",
                "scripts": {
                    "test": "echo \"Error: no test specified\" && exit 1"
                },
                keywords:['meteor-it'],
                "author": res.author,
                "license": res.license,
                "devDependencies": {},
                "dependencies": {},
                "peerDependencies":{},
                "optionalDependencies":{},
                "repository": res.repo,
                "engines":{ "node" : '^7.8.0'}
            }));
            let readmeMd=resolve(fullPath,'README.MD');
            if(!await exists(readmeMd))
                await writeFile(readmeMd,'# '+dir+'\n'+res.defaultDescription);
            let authorsMd=resolve(fullPath,'AUTHORS.MD');
            if(!await exists(authorsMd))
                await writeFile(authorsMd,'# Authors\n\n'+res.author);
            let licenseMd=resolve(fullPath,'LICENSE.MD');
            if(!await exists(licenseMd))
                await writeFile(licenseMd,licenses[res.license].licenseText);
        });
    })
    .option('defaultVersion', {
        required: false,
        help: 'Default version to create',
        default: '0.0.1'
    })
    .option('defaultDescription', {
        required: true,
        help: 'Default description to create'
    })
    .option('dir', {
        required: true,
        help: 'Dir with all packages'
    })
    .option('license', {
        required: false,
        help: 'License to packages',
        default: 'MIT'
    })
    .option('repo',{
        required: false,
        help: 'Repository',
        default: 'gitlab:Creeplays/meteor-it-framework'
    })
    .option('author', {
        required: false,
        help: 'Author of packages',
        default: 'Yaroslaw Bolyulin <iam@f6cf.pw> (http://f6cf.pw/)'
    })
    .option('namespace', {
        required: false,
        help: 'Namespace for all packages',
        default: '@meteor-it'
    });
argParser.parse();
