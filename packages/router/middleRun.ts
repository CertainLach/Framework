import Logger from '@meteor-it/logger';
import {IRouterContext} from "./";

export default function middleRun<T>(middleware: Function | Function[]): (context:IRouterContext<any>)=>()=>Promise<void|T> {
    if (!(middleware instanceof Array)) {
        middleware = [middleware]
    }
    middleware = middleware as Function[];

    return (parent:IRouterContext<any>) => {
        // parent.logger.ident('middleRun#inner');

        let finalPromise:any;
        let index = 0;
        let isResolved = false;
        let value: T;

        const state = (parent && parent.state) || {};
        const parentKeys = parent ? Object.keys(parent) : [];
        const parentKeysLength = parentKeys.length;

        async function loop() {
            if (isResolved) {
                return value;
            } else if (index >= middleware.length) {
                return parent && parent.next && parent.next()
            }

            const args: IRouterContext<any> = {
                ...parent,
                state
            };

            let nextCalled = false;
            let nextResult:any;
            args.next = async ()=>{
                try {
                    if (!nextCalled) {
                        nextCalled = true;
                        nextResult = await loop()
                    }
                }catch (e) {
                    throw e;
                }
                return nextResult;
            };

            let stepResolve:any;
            const stepPromise = new Promise(resolve => {
                stepResolve = resolve
            });
            args.resolve = function resolve(val:any) {
                isResolved = true;
                if (stepResolve) {
                    if (arguments.length >= 1) value = val;
                    stepResolve();
                    stepResolve = null
                }
                return finalPromise
            };

            const current = (middleware as Function[])[index++];
            const result = current(args);
            let res = await Promise.race([result, stepPromise]);
            return args.next(res);
        }

        return loop;
    }
};