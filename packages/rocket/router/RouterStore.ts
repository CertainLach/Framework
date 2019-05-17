import Store from '../stores/store';
import { observable, computed } from 'mobx';
import { isBrowserEnvironment } from '@meteor-it/utils';

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
        if (isBrowserEnvironment())
            forceRerender();
    }
    @computed
    get query() {
        return this._query;
    }
    set query(to: { [key: string]: string }) {
        this._hasRedirect = true;
        this._query = to;
        if (isBrowserEnvironment())
            forceRerender();
    }
    go(url: string) {
        this._hasRedirect = true;
        this._path = url;
        if (isBrowserEnvironment())
            window.history.pushState({}, '', url);
        this._path = url;
        if (isBrowserEnvironment())
            forceRerender();
    }
}
