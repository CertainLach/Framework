
import {EventEmitter} from 'events';
import {parse} from 'url';

import middleRun from './middleRun';
import wrapMiddleware from './wrapMiddleware';

interface IContextNextMethodAttachment {
    next():void;
}

export default class URouter<C> extends EventEmitter {
    middleware:any[]=[];
    private routing:any = null;
    private context:any = {};
    constructor(){
        super();
    }
    use(path:string|null,...callbacks:((ctx:C&IContextNextMethodAttachment)=>void|URouter<C&IContextNextMethodAttachment>)[]){
        const middleware = this.middleware;
        for (let callback of callbacks) {
            if(callback instanceof URouter)
                middleware.push(wrapMiddleware(path,true,middleRun(callback.middleware)));
            else
                middleware.push(wrapMiddleware(path,false,callback));
        }
        return this;
    }
    route(path:string,state:C=null){
        const self = this;
        const location = parse(path, true);
        const args = {
            location,
            path: location.pathname,
            params: {},
            state,
            router: this,
            context: this.context
        };
        const promise = Promise.resolve(args)
            .then(<any>middleRun(<any>this.middleware));

        self.routing = promise;
        promise.then(()=>self.routing = null, ()=>self.routing = null);

        this.emit('beforeroute', args, promise);
        this.emit('route', args, promise);
        return promise;
    }
}