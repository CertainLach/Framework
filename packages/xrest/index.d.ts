/// <reference types="node" />
import { IncomingMessage } from 'http';
export * from './multipart';
export interface IXResponse extends IncomingMessage {
    body: any;
    raw: Buffer;
    headers: any;
}
export declare function emit(eventString: string, options?: any): Promise<IXResponse>;
export default class XRest {
    baseUrl: any;
    defaultOptions: any;
    constructor(url: any, defaultOptions: any);
    emit(eventString: any, options: any): Promise<IXResponse>;
}
