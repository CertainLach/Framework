/// <reference types="node" />
import { IncomingMessage, Agent } from 'http';
import { IMultiPartData } from "./multipart";
export * from './multipart';
export declare type IRequestHeaders = {
    [key: string]: string | number;
};
export declare type IRequestRepeatOptions = {
    repeatIn?: number;
    shouldRepeatOnTimeout?: boolean;
    shouldRepeatBeIncrementing?: boolean;
    maxRepeatIncrementMultipler?: number;
};
export declare type IRequestOptions = {
    /**
     * Additional headers to include with request
     */
    headers?: IRequestHeaders;
    /**
     * POST data
     */
    data?: Buffer | string | IMultiPartData;
    /**
     * Request method
     */
    method?: string;
    /**
     * Should library follow redirect responses
     */
    followRedirects?: boolean;
    /**
     * Time allowed to make a request
     * if 0 - then request can long forever
     */
    timeout?: number;
    repeat?: IRequestRepeatOptions;
    /**
     * Parse body as JSON/XML/any
     * @param data
     */
    parser?: (data: string) => Promise<any>;
    /**
     * Request query parameters
     */
    query?: string | {
        [key: string]: string | number;
    };
    /**
     * Should data field to be handled as IMultiPartData
     */
    multipart?: boolean;
    encoding?: string;
    decoding?: string;
    rejectUnauthorized?: boolean;
    agent?: Agent;
    /**
     * Internal
     * TODO: Move to Request
     */
    timeoutFn?: any;
    /**
     * login for the basic auth
     */
    username?: string;
    /**
     * password for the basic auth
     */
    password?: string;
    /**
     * token for the bearer auth
     */
    accessToken?: string;
};
export declare type IExtendedIncomingMessage = IncomingMessage & {
    raw: Buffer;
    rawEncoded: Buffer;
};
export declare function emit(method: string, path: string, options?: IRequestOptions): Promise<IExtendedIncomingMessage>;
export default class XRest {
    baseUrl: string;
    defaultOptions: IRequestOptions;
    constructor(url: string, defaultOptions: IRequestOptions);
    emit(event: string, path: string, options: IRequestOptions): Promise<IExtendedIncomingMessage>;
}
