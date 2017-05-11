import Logger from "@meteor-it/logger";

let logger=new Logger('Queuer');

export let allQueuesTasks=0;
export function queue(time,fn){
    function queueDecorator(target, key, descriptor) {
        let queued=[];
        let origFun=descriptor.value;
        let stopped=true;
        async function process() {
            try {
                if (queued.length == 0) {
                    stopped = true;
                    return;
                }
                stopped = false;
                let startTime = new Date().getTime();
                let q = queued.shift();
                try {
                    let result = await origFun.call(q.context,...q.args);//(...q.args);
                    q.resolve(result);
                } catch (e) {
                    q.reject(e);
                }
                allQueuesTasks--;
                if (new Date().getTime() - startTime >= time) {
                    setTimeout(()=>process(), 1);
                } else {
                    setTimeout(()=>process(), time - (new Date().getTime() - startTime));
                }
            }catch (e){
                logger.error('Error on processing tasks for '+key,e);
            }
        };
        descriptor.value = function (){
            let context=this;
            let args=arguments;
            return new Promise((resolve,reject)=>{
                allQueuesTasks++;
                queued.push({
                    reject:reject,
                    resolve:resolve,
                    args:args,
                    context:context
                });
                if(stopped)
                    process();
            });
        };
        return descriptor;
    }
    if(!fn)
        return queueDecorator;
    let kostyl={
        value: fn
    };
    return queueDecorator({},fn.name||'<anonymous>',kostyl).value;
}