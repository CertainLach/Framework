// import levelUP from 'level';
// import levelTTL from 'level-ttl';
import Logger from "@meteor-it/logger";
// import Promise from "bluebird";
// import UUID from "./UUID";

export default class NGCache{
    static logger=new Logger('cache');
    // static level=levelTTL(levelUP(__dirname+'/../../data/cache'+UUID.create()+'.lup'));
    static cache={};
    static timeouts={};
    async static set(key,value){
        // if(process.env.NOCACHE){
        //     return;
        // }
        NGCache.cache[key]=value;
        if(NGCache.timeouts[key])
            clearTimeout(NGCache.timeouts[key]);
        NGCache.timeouts[key]=setTimeout(()=>{
            delete NGCache.cache[key];
            delete NGCache.timeouts[key];
        },60000);
        // NGCache._set(key,value);
    }
    async static get(key){
        // if(process.env.NOCACHE) {
        //     this.logger.debug('NOCACHE!');
        //     return null;
        // }
        let value=NGCache.cache[key];
        if(value){
            clearTimeout(NGCache.timeouts[key]);
            NGCache.timeouts[key]=setTimeout(()=>{
                delete NGCache.cache[key];
                delete NGCache.timeouts[key];
            },60000);
            return value;
        }
        // let res= await NGCache._get(key);
        // if(res){
        //     NGCache.cache[key]=res;
        //     if(NGCache.timeouts[key])
        //         clearTimeout(NGCache.timeouts[key]);
        //     NGCache.timeouts[key]=setTimeout(()=>{
        //         delete NGCache.cache[key];
        //         delete NGCache.timeouts[key];
        //     },60000);
        // }
        // return res;
    }
    // static _get(key){
    //     return new Promise((resolve,reject)=>{
    //         // if(process.env.NOCACHE) {
    //         //     resolve(null);
    //         //     return;
    //         // }
    //         NGCache.level.get(key, (err, value)=>{
    //             if(err) {
    //                 resolve(null);
    //                 return;
    //             }
    //             resolve(JSON.parse(value));
    //         });
    //     });
    // }
    // static _set(key,value){
    //     return new Promise((resolve,reject)=>{
    //         // if(process.env.NOCACHE) {
    //         //     resolve(null);
    //         //     return;
    //         // }
    //         NGCache.level.put(key, JSON.stringify(value), { ttl: 1000*60*60 },err=>{
    //             if(err) {
    //                 reject(err);
    //                 return;
    //             }
    //             resolve();
    //         });
    //     });
    // }
}