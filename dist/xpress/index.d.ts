import Logger from '@meteor-it/logger';
export declare class Router {
    logger: Logger;
    middlewares: any[];
    routeIndexKey: symbol;
    constructor(name: any);
    use(handler: any): void;
    on(eventString: any, handler: any): void;
    handle(req: any, res: any, next: any, fakeUrl: any): void;
}
export default class XPress extends Router {
    server: any;
    logger: any;
    constructor(name: any);
    addPossible(event: any): void;
    parseReqUrl(req: any): void;
    populateReqHeader(req: any): void;
    populateRequest(req: any): void;
    populateResHeader(res: any): void;
    populateResponse(res: any): void;
    httpHandler(req: any, res: any): void;
    listenListeners: any[];
    onListen(func: any): void;
    listenHttp(host: string, port: any, silent?: boolean): Promise<{}>;
    listenHttps(host: string, port: any, certs: any, silent?: boolean): Promise<{}>;
}
export declare function developerErrorPageHandler(title: any, desc: any, stack?: any): string;
export declare function userErrorPageHandler(hello: any, whatHappened: any, sorry: any, post: any): string;
