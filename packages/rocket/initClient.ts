import { hydrate, render } from 'react-dom';
import { parse as parseQuerystring } from 'querystring';
import Rocket from './Rocket';
import { IRocketRouterState } from './router';
import {cleanUpBrowserStoreList} from "./stores/useStore";
import {setForceRerender} from "./router/RouterStore";

// Lazy initialized, because this code can be somehow processed 
// on server, but a regexp requires access to window
let IS_INTERNAL_REGEXP:RegExp = null;

function sameOrigin(url:string): boolean {
    return !!IS_INTERNAL_REGEXP.test(url);
}
function isLink(el:any): Element {
    while (el && el.nodeName !== 'A') el = el.parentNode;
    if (!el || el.nodeName !== 'A') return null;
    return el;
}

let lastClick = 0;
async function rerunRoute(rocket: Rocket, initial: boolean) {
    lastClick++;
    let path = location.pathname;
    // substr(1) is needed, because location.search starts with "?""
    let qs:{[key:string]:string};
    if (location.search === '' || location.search === '?') {
        qs = {};
    } else if (location.search.startsWith('?')) {
        qs = parseQuerystring(location.search.substr(1)) as any;
    }
    let currentState: IRocketRouterState;;
    await (rocket.router as any).route(path, (ctx:any) => {
        currentState = ctx.state;
        ctx.query = qs;
    });
    // TODO: Fix possible stackoverflow on rerender
    setForceRerender(()=>{
        setTimeout(() => rerunRoute(rocket, false), 1);
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
        if (initial && process.env.NODE_ENV === 'production')
            hydrate(currentState.drawTarget, rootElement);
        else
            render(currentState.drawTarget, rootElement);
    }
}

/**
 * As different function to allow tree-shaking
 * @param rocket 
 */
export default async function initClient(rocket: Rocket) {
    IS_INTERNAL_REGEXP = new RegExp('^(?:(?:http[s]?:\/\/)?' + window.location.host.replace(/\./g, '\\.') + ')?\/?[#?]?', 'i');
    // TODO: Patch react via babel
    if (process.env.NODE_ENV === 'production'){
        if (typeof window !== 'undefined' && typeof (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ === "object") {
            for (let [key, value] of Object.entries((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__)) {
                (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__[key] = typeof value == "function" ? ()=>{} : null;
            }
        }
    }
    cleanUpBrowserStoreList();
    await rerunRoute(rocket, true);
    // Add listeners after initial render is completed to handle <a> by internal router
    window.addEventListener('popstate', e => rerunRoute(rocket, false), false);
    window.addEventListener('click', e => {
        let el = isLink(e.target);
        if (!el) return;
        if (el.getAttribute('download')) return;
        if (el.getAttribute('rel') === 'external') return;
        if (el.getAttribute('target') && el.getAttribute('target') !== '_self') return;
        let url = el.getAttribute('href');
        if (url && url.indexOf('mailto:') === 0) return;
        if (!sameOrigin(url)) return;
        window.history.pushState({}, '', url);
        e.preventDefault();
        rerunRoute(rocket, false);
    }, false);
}