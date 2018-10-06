"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inferno_1 = require("inferno");
const inferno_devtools_1 = require("inferno-devtools");
const querystring_1 = require("querystring");
// Lazy initialized, because this code can be somehow processed 
// on server, but a regexp requires access to window
let IS_INTERNAL_REGEXP = null;
function sameOrigin(url) {
    return !!IS_INTERNAL_REGEXP.test(url);
}
;
function isLink(el) {
    while (el && el.nodeName !== 'A')
        el = el.parentNode;
    if (!el || el.nodeName !== 'A')
        return null;
    return el;
}
;
let lastClick = 0;
async function rerunRoute(rocket, initial) {
    lastClick++;
    let path = location.pathname;
    // substr(1) is needed, because location.search starts with "?""
    let qs;
    if (location.search === '' || location.search === '?') {
        qs = {};
    }
    else if (location.search.startsWith('?')) {
        qs = querystring_1.parse(location.search.substr(1));
    }
    let currentState = { drawTarget: null, store: null, redirectTarget: null };
    await rocket.router.route(path, ctx => {
        ctx.state = currentState;
        ctx.query = qs;
    });
    lastClick--;
    if (currentState.redirectTarget !== null) {
        history.replaceState(history.state, null, currentState.redirectTarget);
        setTimeout(() => rerunRoute(rocket, initial), 1);
        return;
    }
    // Render only last click result
    if (lastClick === 0) {
        const rootElement = process.env.NODE_ENV === 'development' ? document.getElementById('root') : document.body.children[0];
        if (initial)
            currentState.store.helmet.forceUpdate();
        if (initial && process.env.NODE_ENV === 'production')
            inferno_1.hydrate(currentState.drawTarget, rootElement);
        else
            inferno_1.render(currentState.drawTarget, rootElement);
    }
}
/**
 * As different function to allow tree-shaking
 * @param rocket
 */
async function initClient(rocket) {
    IS_INTERNAL_REGEXP = new RegExp('^(?:(?:http[s]?:\/\/)?' + window.location.host.replace(/\./g, '\\.') + ')?\/?[#?]?', 'i');
    if (process.env.NODE_ENV === 'development')
        inferno_devtools_1.initDevTools();
    await rerunRoute(rocket, true);
    // Add listeners after initial render is completed to handle <a> by internal router
    window.addEventListener('popstate', e => rerunRoute(rocket, false), false);
    window.addEventListener('click', e => {
        let el = isLink(e.target);
        if (!el)
            return;
        if (el.getAttribute('download'))
            return;
        if (el.getAttribute('rel') === 'external')
            return;
        if (el.getAttribute('target') && el.getAttribute('target') !== '_self')
            return;
        let url = el.getAttribute('href');
        if (url && url.indexOf('mailto:') === 0)
            return;
        if (!sameOrigin(url))
            return;
        window.history.pushState({}, '', url);
        e.preventDefault();
        rerunRoute(rocket, false);
    }, false);
}
exports.default = initClient;
//# sourceMappingURL=initClient.jsx.map