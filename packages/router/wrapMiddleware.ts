import pathToRegexp from './pathToRegexp';

function clone (object) {
    const copy = {};
    const keys = Object.keys(object);
    for (let i = 0, ii = keys.length; i < ii; ++i) {
        copy[keys[i]] = object[keys[i]]
    }
    return copy
}

export default function wrapMiddleware (matchPath, isRouter, middleware) {
    if (!matchPath || matchPath === '*') return middleware;

    if (isRouter) matchPath = `${matchPath.replace(/\/+$/, '')}/(.*)?`;
    const keys = [];
    const regex = pathToRegexp(matchPath, keys);

    return step => {
        const matches = regex.exec(decodeURIComponent(step.path));
        if (!matches) return;

        if (isRouter) {
            step.path = `/${(matches[matches.length - 1] || '').replace(/^\/+/, '')}`;
        }

        const params = step.params = clone(step.params);
        for (let i = 1, ii = matches.length; i < ii; ++i) {
            const key = keys[i - 1];
            if (key) params[key.name] = matches[i]
        }

        return middleware(step)
    }
};