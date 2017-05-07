import Api from "./Api";
import {queue} from "../../framework/Queuer";
import NGRest from "../../framework/sources/NGRest";
import Bot from '../../bot.js';
import AntiCaptcha from "../../framework/AntiCaptcha";
/**
 * Created by Creeplays on 24.08.2016.
 */
export default class VKApi extends Api{
    constructor(bot){
        super(bot,'VKAPI');
        this.anticaptcha=bot.anticaptcha;
    }
    async auth(token){
        this.token=token;
    }
    @queue(500)
    async execute(method,params={},postData=null,solved=null){
        params.access_token=this.token;
        params.version='5.53';
        params.ver='5.53';
        params.v='5.53';
        let res=await NGRest.get('https://api.vk.com/method/'+method,{query:params});
        if(res.error)
            if(res.error.error_code==14) {
                if(solved)
                    solved.reportWrong();
                let captcha=this.bot.anticaptcha.processURL(res.error.captcha_img);
                params.captcha_sid=res.error.captcha_sid;
                params.captcha_key=captcha.value;
                res = await this.execute(method, params,postData, captcha);
            }
        if(res.response)
            return res.response;
        else if(res.error)
            throw new Error(JSON.stringify(res.error));
    }
}


//
// import Rest from "./../framework/sources/Rest.js";
// import {encode} from "./helpers/UrlParam";
// import Logger from "../framework/logger/Logger";
// import Queue from "../framework/Queue";
// import * as uuid from "node-uuid";
// import Cache from "../framework/Cache";
//
// export default class VKApi{
//     token;
//     queuer;
//     updatePostfix;
//     redis;
//     cache;
//
//     constructor(){
//         this.logger=new Logger('VKApi');
//         this.queuer=new Queue(this._execute,400);
//     }
//     async auth(login,password){
//         //FIXME: hardcoded token
//         this.token="eb95d1ac794622e5569dfcb57dfb1303576d2b1b1c22499cb8992a3517605f841e437589b3e6d8c27ff74";
//         if(this.token){
//             //Use cache!
//             this.logger.log("Using cached token")
//             //this.token=this.token;
//         }else {
//             this.logger.log("Loading token");
//             let response = await Rest.get(`https://oauth.vk.com/token?grant_type=password&client_id=3697615&client_secret=AlVXZFMUqyrnABp8ncuU&username=${login}&password=${password}&scope=notify,friends,photos,audio,video,docs,notes,pages,status,offers,questions,wall,groups,messages,email,notifications,stats,ads,market,offline`);
//             this.logger.log("Token loaded!");
//             this.token = response.access_token;
//             this.logger.log("TOKEN: "+this.token);
//         }
//         this.updatePostfix=uuid.v4();
//         return this.updatePostfix;
//     }
//     async _execute(method,params,cache){
//         if(!this.cache)
//             this.cache=new Cache('botData:cache:vkApi:call',this.redis,60,120);
//         let url=('https://api.vk.com/method/'+method)+'?'+encode(params);
//         try {
//             if(cache){
//                 let cached=await this.redis.get('botData:cache:vkApi:call:' + url);
//                 if(cached!=null)
//                     return JSON.parse(cached);
//             }
//             let value= await Rest.get(url);
//             if(cache) {
//                 await this.redis.set('botData:cache:vkApi:call:' + url,JSON.stringify(value));
//                 await this.redis.expire('botData:cache:vkApi:call:' + url,15000);
//             }
//             return value;
//         }catch (e){
//             console.error(e);
//             this.execute(method,params,cache);
//         }
//     }
//
//     async execute(method,params,cache=false){
//         if(!params)
//             params={};
//         params.access_token=this.token;
//         params.version="5.45";
//         params.v=params.version;
//         if(this.queuer.ready)
//             return await this.queuer.call(method,params);
//     }
//     ts;
//     server;
//     key;
//
//     async startMessageReceiver(){
//         let serverData=await this.execute('messages.getLongPollServer');
//         this.logger.log("Got long pool server data");
//         this.ts=serverData.ts;
//         this.server=serverData.server;
//         this.key=serverData.key;
//         setTimeout(()=>this.receive(), 1);
//     }
//
//     async receive(){
//         try {
//             let url = `https://${this.server}?act=a_check&key=${this.key}&ts=${this.ts}&wait=25&mode=234&version=1`;
//             let response = await Rest.get(url);
//             switch (response.failed) {
//                 case 1:
//                     this.ts = response.ts;
//                     setTimeout(()=>this.receive(), 1);
//                     return;
//                 case 2:
//                     setTimeout(()=>this.startMessageReceiver(), 1);
//                     return;
//                 case 3:
//                     setTimeout(()=>this.startMessageReceiver(), 1);
//                     return;
//             }
//             this.ts = response.ts;
//             this.processUpdates(response.updates);
//             setTimeout(()=>this.receive(), 1);
//         }catch(e){
//             this.logger.err(e);
//         }
//     }
//     async processUpdates(updates){
//         updates.forEach(update=>{
//             this.eventEmitter.emit('update'+this.updatePostfix,update);
//         });
//     }
//     setRedis(redis){
//         this.redis=redis;
//     }
//
//     setMessageHandler(eventEmitter) {
//         this.eventEmitter=eventEmitter;
//     }
// }
//
//
//
//


























