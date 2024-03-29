import { Key, pathToRegexp } from "path-to-regexp";
import middleRun from './middleRun';

const cachedPaths = new Set();
const keysCache: Map<string, Key[]> = new Map<string, Key[]>();
const regexCache: Map<string, RegExp> = new Map<string, RegExp>();

const methodIsAny = (method: string | null) => method === null || method === 'ALL';
const pathIsAny = (path: string | null) => path === null || path === '*' || path === '/*';

// TODO: Extract types
export function wrapMiddleware(method: string | null, matchPath: string | null, middleware: (SinglePathMiddleware<any, any, any> | RoutingMiddleware<any, any, any> | Router<any, any> | ((context: IRouterContext<any>) => void))) {
    const anyMethod = methodIsAny(method);
    const anyPath = pathIsAny(matchPath);

    const isRouter = middleware instanceof Router;
    const isRouting = middleware instanceof RoutingMiddleware;
    const isSinglePath = middleware instanceof SinglePathMiddleware;

    // TODO:
    const isOOPMiddleware = isRouting || isSinglePath || typeof middleware !== 'function';

    const needToRewritePath = isRouter || isRouting;

    // Filtering isn't needed
    if (anyMethod && anyPath) {
        if (!isRouter && !isOOPMiddleware)
            return middleware;
        if (isRouter) {
            return async (step: IRouterContext<unknown>) => await (middleware as Router<any, any>).route(step.path, (d: IRouterContext<any>) => {
                for (let key in step)
                    if (!(key in d))
                        (d as any)[key] = (step as any)[key];
            });
        } else if (isOOPMiddleware) {
            return async (step: IRouterContext<unknown>) => await (middleware as SinglePathMiddleware<any, any, any> | RoutingMiddleware<any, any, any>).handle(step);
        }
    }

    // Rewrite url to crosscompose routers
    // /a/b/c/ => /a/b/c/(.*)?
    if (matchPath !== null && needToRewritePath)
        matchPath = `${matchPath.replace(/\/+$/, '')}/(.*)?`;

    // Cache parsing data
    let keys: Key[];
    let regex: RegExp;

    // No need to parse path, because it is already parsed
    if (!anyPath && matchPath !== null) {
        if (cachedPaths.has(matchPath)) {
            keys = keysCache.get(matchPath) as Key[];
            regex = regexCache.get(matchPath) as RegExp;
        } else {
            keys = [];
            regex = pathToRegexp(matchPath, keys, {});
            keysCache.set(matchPath, keys);
            regexCache.set(matchPath, regex);
            cachedPaths.add(matchPath);
        }
    }

    return async (step: IRouterContext<any>) => {
        // Method test
        if (!anyMethod && step.method !== method)
            return;
        // Path test
        if (!anyPath) {
            const matches = regex.exec(decodeURIComponent(step.path));
            if (!matches) return;

            // Rewrite routing url back
            // /a/b/c/<DATA> => /<DATA>
            if (needToRewritePath)
                step.path = `/${(matches[matches.length - 1] || '').replace(/^\/+/, '')}`;

            // Fill step params, TODO: ignore params from previous router
            for (let i = 1, ii = matches.length; i < ii; ++i) {
                const key = keys[i - 1];
                if (key) step.params[key.name] = matches[i]
            }
        }

        // TODO: Wtf, typescript, why are you sure isRouter isn't a typeguard?
        // Finally post step to middleware
        if (isRouter) {
            await (middleware as Router<any, any>).route(step.path, (d: IRouterContext<any>) => {
                for (let key in step)
                    if (!(key in d))
                        (d as any)[key] = (step as any)[key];
            });
        } else if (isOOPMiddleware) {
            await (middleware as SinglePathMiddleware<any, any, any> | RoutingMiddleware<any, any, any>).handle(step);
        } else {
            await (middleware as any)(step);
        }
    }
}

/**
 * Object, which will be passed through middleware chain
 */
export type IRouterContext<S, M = any> = {
    url: URL;
    path: string;
    method?: M;
    params: { [key: string]: string };
    state?: S;
    router: Router<any, S>;
    next?: (err?: Error) => Promise<void> | void;
    requestId: number;
};

let requestId = 0;

export abstract class MultiMiddleware {
    abstract setup(router: Router<any, any, any>, path: string | null): void;
}

export abstract class SinglePathMiddleware<E, S, M> {
    abstract handle(ctx: E & IRouterContext<S, M | 'ALL' | null>): Promise<void>;
}

export abstract class RoutingMiddleware<E, S, M> {
    abstract handle(ctx: E & IRouterContext<S, M | 'ALL' | null>): Promise<void>;
}

export default class Router<E, S, M = any> {
    constructor(public readonly defaultState?: () => S) { }

    middleware: (((ctx: E & IRouterContext<S, M | 'ALL' | null>) => void) | Router<any, S> | SinglePathMiddleware<any, S, M> | RoutingMiddleware<any, S, M>)[] = [];

    /**
     * Utility method for middlewares with multuple paths
     * @param path
     * @param mmw
     */
    use(path: string | null, mmw: MultiMiddleware) {
        mmw.setup(this, path);
    }

    on(method: M | 'ALL' | null, path: string | null, ...callbacks: (((ctx: E & IRouterContext<S, M | 'ALL' | null>) => void) | Router<any, S> | SinglePathMiddleware<any, S, M> | RoutingMiddleware<any, S, M>)[]): void {
        if (method !== null && (method as string).toUpperCase() !== method) {
            throw new Error(`Method name should be uppercase! (Got: ${method})`);
        }
        const middleware = this.middleware;
        for (let callback of callbacks) {
            middleware.push(wrapMiddleware(method as any, path, callback as any));
        }
    }

    async route(path: string, fillContext: (ctx: E & IRouterContext<S, M | 'ALL' | null>) => void): Promise<void | {}> {
        requestId++;
        const urlStr = new URL(path, 'base:');
        const context: IRouterContext<S, M | 'ALL' | null> = {
            requestId,
            url: urlStr,
            path: urlStr.pathname,
            params: {},
            state: this.defaultState?.(),
            router: this
        };
        fillContext(context as E & IRouterContext<S, M | 'ALL' | null>);
        return await middleRun(this.middleware as any)(context)();
    }
}
