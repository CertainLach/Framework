import {exec} from 'child_process';

export async function exec(what,options){
    return new Promise((resolve, reject)=>{
        exec(what,options,(err,stdout,stderr)=>{
            if(err){
                reject(err);
                return;
            }
            resolve({
                stdout,
                stderr
            })
        });
    });
}