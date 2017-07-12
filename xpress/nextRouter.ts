import {
    parse as urlparse
}
from 'url';
import * as http from 'http';

const METHODS = http.METHODS.map(method => method.toLowerCase());

class Router {
    constructor(url, strict) {
        this.keys = null;
        if (url instanceof RegExp) {
            this.rex = url;
            this.source = this.rex.source;
            return;
        }

        const keys = [];
        this.source = url;
        // '/' => '\/'
        url = url.replace(/\//g, '\\/')
            // '.' => '\.?'
            .replace(/\./g, '\\.?')
            // '*' => '.+'
            .replace(/\*/g, '.+');

        // ':id' => ([^\/]+),
        // ':id?' => ([^\/]*),
        // ':id([0-9]+)' => ([0-9]+)+,
        // ':id([0-9]+)?' => ([0-9]+)*
        url = url.replace(/:(\w+)(?:\(([^\)]+)\))?(\?)?/g, (all, name, rex, atLeastOne) => {
            keys.push(name);
            if (!rex) {
                rex = `[^\\/]${atLeastOne === '?' ? '*' : '+'}`;
            }
            return `(${rex})`;
        });
        // /user/:id => /user, /user/123
        url = url.replace(/\\\/\(\[\^\\\/\]\*\)/g, '(?:\\/(\\w*))?');
        this.keys = keys;
        let re = `^${url}`;
        if (!strict) {
            re += '\\/?';
        }
        re += '$';
        this.rex = new RegExp(re);
    }

    /**
     * Try to match given pathname, if match, return the match `params`.
     *
     * @param {String} pathname
     * @return {Object|null} match `params` or null.
     */
    match(pathname) {
        const m = this.rex.exec(pathname);
        // console.log(this.rex, pathname, this.keys, m, this.source)
        let match = null;
        if (m) {
            if (!this.keys) {
                return m.slice(1);
            }
            match = {};
            const keys = this.keys;
            for (let i = 0, l = keys.length; i < l; i++) {
                const value = m[i + 1];
                if (value) {
                    match[keys[i]] = value;
                }
            }
        }
        return match;
    }
}

function flatten(arr, ret) {
    ret = ret || [];
    const len = arr.length;
    for (let i = 0; i < len; ++i) {
        if (Array.isArray(arr[i])) {
            exports.flatten(arr[i], ret);
        }
        else {
            ret.push(arr[i]);
        }
    }
    return ret;
}

// Express styled router
export function router(defineRoutes, options) {
    const routes = [];
    const methods = {};

    function createMethod(name) {
        const localRoutes = routes[name.toUpperCase()] = [];
        // fn(url[, middleware[s]], handle)
        return function routeMethod(urlpattern, ...handlers) {
            let middleware = null;
            let handle = null;

            if (handlers.length === 0)
                throw new Error('No handlers was defined!');
            else if (handlers.length > 1) {
                // Last handler - real
                handle = handlers.pop();
                middleware = flatten(handlers);
            }
            else if (handlers.length === 1)
                handle = handlers[0];

            const t = typeof handle;
            if (t !== 'function') {
                throw new TypeError(`handle must be function, not ${t}`);
            }

            localRoutes.push([new Router(urlpattern,false), handle, middleware]);
        };
    }

    METHODS.forEach(method => {
        methods[method] = createMethod(method);
    });
    methods.all = createMethod('all');
    methods.r = (defineRoutes)=>router(defineRoutes,options);
    methods.use = methods.all;
    methods.ws = createMethod('ws');
    methods.on = (urlPath,...handlers)=>{
        let [method,path]=urlPath.split(' ');
        methods[method.toLowerCase()](path, ...handlers);
    };
    methods.redirect = (urlpattern, to) => {
        if (!to || typeof to !== 'string') {
            throw new TypeError(`${JSON.stringify(to)} must be string`);
        }

        if (!routes.redirects) {
            routes.redirects = [];
        }
        routes.redirects.push([new Router(urlpattern, true), (req, res) => {
            options.redirectHandler(res, to, 301);
        }]);
    };

    defineRoutes(methods);

    return function lookup(req, res, next) {
        const method = req.method.toUpperCase();
        let localRoutes = routes[method] || [];
        const allRoutes = routes.ALL;
        if (allRoutes) {
            localRoutes = localRoutes.concat(allRoutes);
        }
        if (routes.redirects) {
            localRoutes = routes.redirects.concat(localRoutes);
        }

        if (localRoutes.length > 0) {
            const pathname = urlparse(req.url).pathname;
            for (let i = 0, l = localRoutes.length; i < l; i++) {
                const route = localRoutes[i];
                const urlroute = route[0];
                const handle = route[1];
                const middleware = route[2];
                const match = urlroute.match(pathname);
                if (!match) {
                    continue;
                }

                if (!req.params) {
                    req.params = match;
                }
                else {
                    const params = req.params;
                    for (let k in match) {
                        params[k] = match[k];
                    }
                }

                // if middleware not exists or empty, return directly
                if (!middleware || !middleware.length) {
                    return handle(req, res, next);
                }
                // route middleware
                let k = 0;
                const routeMiddleware = err => {
                    const mw = middleware[k++];
                    if (err) {
                        const errHandler = next || options.errorHandler;
                        return errHandler(err, req, res);
                    }
                    else if (mw) {
                        return mw(req, res, routeMiddleware);
                    }
                    else {
                        return handle(req, res, next);
                    }
                };

                return routeMiddleware();
            }
        }
        next ? next() : options.notFoundHandler(req, res);
    };
}
