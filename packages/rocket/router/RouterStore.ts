import Store from '../stores/store';
import { observable, computed } from 'mobx';

// TODO: Oh my...
let forceRerender: () => void = () => { };
export function setForceRerender(func: () => void) {
    forceRerender = func;
}

export default class RouterStore extends Store {
    static id = '$$router';
    @observable
    private _query: { [key: string]: string };
    @observable
    private _path: string;
    private _hasRedirect: boolean = false;
    setDataNoRerender(path: string, qs: { [key: string]: string }) {
        this._path = path;
        this._query = qs;
    }
    get hasRedirect() {
        return this._hasRedirect;
    }
    @computed
    get path() {
        return this._path;
    }
    set path(url: string) {
        this._hasRedirect = true;
        if (process.env.BROWSER)
            forceRerender();
    }
    @computed
    get query() {
        return this._query;
    }
    set query(to: { [key: string]: string }) {
        this._hasRedirect = true;
        this._query = to;
        if (process.env.BROWSER)
            forceRerender();
    }
    go(url: string) {
        this._hasRedirect = true;
        this._path = url;
        if (process.env.BROWSER)
            window.history.pushState({}, '', url);
        this._path = url;
        if (process.env.BROWSER)
            forceRerender();
    }
}