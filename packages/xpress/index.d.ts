/// <reference types="node" />
import { IncomingMessage, ServerResponse } from 'http';
import { default as WebSocket } from 'uws';
import Logger from '@meteor-it/logger';
import URouter from "@meteor-it/router";
export declare type IIncomingMessageExtension<T = any> = {
    query: {
        [key: string]: any;
    };
    headers: {
        [key: string]: string;
    };
    route: any;
    app: XPress<T>;
    baseUrl: string;
    body: any;
    cookies: any;
    signedCookies: any;
    fresh: boolean;
    stale: boolean;
    hostname: string;
    ip: string;
    ips: string[];
    method: string;
    originalUrl: string;
    path: string;
    protocol: string;
    secure: boolean;
    subdomains: string[];
    xhr: boolean;
    get: (key: string) => string;
};
export declare type IServerResponseExtension<T = any> = {
    sent: boolean;
    set: (key: string, value: string) => void;
    status: (status: number) => ServerResponse & IServerResponseExtension<T>;
    redirect: (url: string) => void;
    send: (data: string | Buffer | any) => void;
};
export declare class XPressRouterContext {
    req: IncomingMessage & IIncomingMessageExtension;
    res: ServerResponse & IServerResponseExtension;
    socket: WebSocket;
    constructor(req: IncomingMessage & IIncomingMessageExtension, res: ServerResponse & IServerResponseExtension);
}
export declare class Router<S> extends URouter<XPressRouterContext, S> {
    constructor(defaultState?: (() => S) | null);
}
export default class XPress<S> extends URouter<XPressRouterContext, S> {
    logger: Logger;
    constructor(name: string | Logger, defaultState?: (() => S) | null);
    populateReqRes(req: IncomingMessage & IIncomingMessageExtension, res: ServerResponse & IServerResponseExtension): void;
    private httpHandler(req, res);
    private wsHandler(socket);
    listenHttp(host: string, port: number, silent?: boolean): Promise<void>;
}
export declare function developerErrorPageHandler(title: string, desc: string, stack?: string | undefined): string;
export declare function userErrorPageHandler(hello: string, whatHappened: string, sorry: string, post: string): string;
