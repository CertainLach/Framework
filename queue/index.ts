import Logger from '@meteor-it/logger';
const queueLogger=new Logger('queue');

export default function queue(time: number=0, maxCalls: number=1, collapser: string=null){
    return function queueDecorator(target, key, descriptor) {
        let queued=[];
        let origFun=descriptor.value;
        let busy=false;
        let startTime;
        async function process() {
            busy=true;
            if(queued.length===0){
                busy=false;
                return;
            }
            startTime=Date.now();

            if(collapser!==null){
                // Collapsed task
                if(maxCalls===1)
                    queueLogger.warn('Collapser is for multiple running tasks in time, but you specified only 1.');
                let willBeExecuted=queued.slice(0,maxCalls);
                queued=queued.slice(maxCalls);
                let multiExecuted=willBeExecuted.map(task=>task.args);
                try{
                    let returns=await (target[collapser].call(willBeExecuted[0].context,multiExecuted));
                    if(!returns)
                        throw new Error('Collapser doesn\'t returned anything!');
                    if(!(returns instanceof Array))
                        throw new Error('Collapser return value isn\'t array!');
                    if(returns.length!==willBeExecuted.length)
                        throw new Error('Collapser returned wrong data array! (Length mismatch)');
                    willBeExecuted.map((task,id)=>{
                        if(returns[id] instanceof Error)
                            task.reject(returns[id]);
                        else
                            task.resolve(returns[id]);
                    });
                }catch(e){
                    willBeExecuted.forEach(task=>task.reject(e));
                }
            }else{
                // Single task
                if(maxCalls!==1)
                    throw new Error('Only 1 call can be processed at time if no collapser is defined!');
                let task=queued.shift();
                try{
                    let data=await origFun.call(task.context,...task.args);
                    if(data instanceof Error)
                        task.reject(data);
                    else
                        task.resolve(data);
                }catch(e){
                    task.reject(e);
                }
            }

            if(queued.length>0){
                let nowTime=Date.now();
                let timeLeftToSleep=startTime+time-nowTime;
                if(timeLeftToSleep<=1){
                    setTimeout(()=>process(),1);
                }else{
                    setTimeout(()=>process(),timeLeftToSleep);
                }
            }else{
                busy=false;
            }
        };
        descriptor.value = function (){
            let context=this;
            let args=arguments;
            return new Promise((resolve,reject)=>{
                queued.push({
                    reject:reject,
                    resolve:resolve,
                    args:args,
                    context:context
                });
                if(!busy)
                    process();
            });
        };
        return descriptor;
    }
}