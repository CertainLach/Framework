
import {EventEmitter} from 'events';
import {parse} from 'url';

import middleRun from './middleRun';
import wrapMiddleware from './wrapMiddleware';


function lazyLoad (step) {
    if (this.loaded) return this.fn(step);
    return Promise.resolve(this.fn(step)).then((fn)=>{
        if (fn instanceof URouter) fn = middleRun((fn as URouter).middleware);
        this.loaded = true;
        return (this.fn = fn)(step)
    })
}

export default class URouter extends EventEmitter {
    private options:any;
    middleware:any[]=[];
    private routing = null;
    private context:any = {};
    constructor(options:any = {}){
        super();
        this.options = options;
    }
    use(path:string|null,...callbacks:(Function|URouter)[]){
        const middleware = this.middleware;
        for (let callback of callbacks) {
            if(callback instanceof URouter)
                callback=middleRun(callback.middleware);
            middleware.push(wrapMiddleware(path,callback instanceof URouter,callback));
        }
        return this;
    }
    lazy(path,...callbacks:Function[]){
        const middleware = this.middleware;
        for (let callback of callbacks) {
            callback = lazyLoad.bind({ callback, loaded: false });
            middleware.push(wrapMiddleware(path, true, callback));
        }
        return this;
    }
    route(path,state=null){
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
    handle(){
        return (req,res,next)=>{
            this.once('beforeroute', (args, routing) => {
                args.request = req;
                args.response = res;
                args.params = req.params;
                args.next = () => { next() };
                routing.catch(next)
            });
            this.route(req.url);
        }
    }
}