export declare class RouterStore {
    location: any;
    history: any;
    constructor();
    _updateLocation(newState: any): void;
    push(location: any): void;
    replace(location: any): void;
    go(n: any): void;
    goBack(): void;
    goForward(): void;
}
export declare const syncHistoryWithStore: (history: any, store: any) => any;
