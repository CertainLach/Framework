import {parse, Url} from 'url';

import middleRun from './middleRun';
import {IKey} from "./pathToRegexp";
import pathToRegexp from "./pathToRegexp";

const cachedPaths = new Set();
const keysCache:Map<string,IKey[]> = new Map<string, IKey[]>();
const regexCache:Map<string,RegExp> = new Map<string, RegExp>();

const methodIsAny = (method:string)=>method===null||method==='ALL';
const pathIsAny = (path:string)=>path===null||path==='*'||path==='/*';

export function wrapMiddleware (method:string, matchPath:string|null, middleware:(Router<any,any>|((context:IRouterContext<any>)=>void))) {
    const anyMethod = methodIsAny(method);
    const anyPath = pathIsAny(matchPath);
    // Filtering isn't needed
    if (anyMethod&&anyPath) return middleware;

    // Rewrite url to crosscompose routers
    // /a/b/c/ => /a/b/c/(.*)?
    if (middleware instanceof Router)
        matchPath = `${matchPath.replace(/\/+$/, '')}/(.*)?`;

    // Cache parsing data
    let keys:IKey[];
    let regex:RegExp;

    // No need to parse path, because it is already parsed
    if(!anyPath) {
        if (cachedPaths.has(matchPath)) {
            keys = keysCache.get(matchPath);
            regex = regexCache.get(matchPath);
        } else {
            keys = [];
            regex = pathToRegexp(matchPath, keys, {});
            keysCache.set(matchPath, keys);
            regexCache.set(matchPath, regex);
            cachedPaths.add(matchPath);
        }
    }

    return async (step:IRouterContext<any>) => {
        // Method test
        if(!anyMethod&&step.method!==method)
            return;
        // Path test
        if(!anyPath){
            const matches = regex.exec(decodeURIComponent(step.path));
            if (!matches) return;

            // Rewrite routing url back
            // /a/b/c/<DATA> => /<DATA>
            if (middleware instanceof Router) step.path = `/${(matches[matches.length - 1] || '').replace(/^\/+/, '')}`;

            // Fill step params, TODO: ignore params from previous router
            for (let i = 1, ii = matches.length; i < ii; ++i) {
                const key = keys[i - 1];
                if (key) step.params[key.name] = matches[i]
            }
        }

        // Finally post step to middleware
        if(middleware instanceof Router) {
            await (middleware as Router<any,any>).route(step.path,(d:IRouterContext<any>)=>{
                for (let key in step)
                    if(!(key in d))
                        (d as any)[key]=(step as any)[key];
            });
        }else await middleware(step);
    }
}

export type IRouterContext<S,M=any> = {
    url:Url;
    path:string;
    method:M;
    params:{[key:string]:string};
    state:S;
    router:Router<any,S>;
    next:(err?:Error)=>Promise<void>|void;
    resolve:(value:any)=>void;
    reject:(error:Error)=>void;
    requestId:number;
};

let requestId = 0;
export default class Router<E,S,M=any> {
    private readonly defaultState:(()=>S)|null;
    constructor(defaultState:()=>S=null){
        this.defaultState = defaultState;
    }
    middleware:(((ctx:E&IRouterContext<S,M|'ALL'|null>)=>void)|Router<any,S>)[]=[];
    on(method:M|'ALL'|null,path:string,...callbacks:(((ctx:E&IRouterContext<S,M|'ALL'|null>)=>void)|Router<any,S>)[]):void{
        if ((method as string).toUpperCase() !== method) {
            throw new Error(`Method name should be uppercase! (Got: ${method})`);
        }
        const middleware = this.middleware;
        for (let callback of callbacks) {
            middleware.push(wrapMiddleware(method,path,callback));
        }
    }
    async route(path:string,fillContext:(ctx:E&IRouterContext<S,M|'ALL'|null>)=>void):Promise<void|{}>{
        requestId++;
        const url = parse(path, true);
        const context:IRouterContext<S,M|'ALL'|null> = {
            requestId,
            url,
            path: url.pathname,
            params: {},
            state: this.defaultState===null?null:this.defaultState(),
            router: this,
            next:(err:Error)=>{}
        } as any;
        fillContext(context as E&IRouterContext<S,M|'ALL'|null>);
        return await middleRun(this.middleware as any)(context)();
    }
}