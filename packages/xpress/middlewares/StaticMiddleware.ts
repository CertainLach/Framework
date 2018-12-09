import {exists, stat} from '@meteor-it/fs';
import {join, resolve} from 'path';
import {lookupByPath} from '@meteor-it/mime';
import {IRouterContext, RoutingMiddleware} from '@meteor-it/router';
import {XPressRouterContext} from '..';
import {constants} from "http2";
import {createReadStream} from "fs";

const {
    HTTP2_HEADER_IF_MODIFIED_SINCE, HTTP2_HEADER_STATUS,
    HTTP2_HEADER_LAST_MODIFIED, HTTP2_HEADER_CACHE_CONTROL,
    HTTP2_HEADER_ETAG, HTTP2_HEADER_CONTENT_ENCODING,
    HTTP2_HEADER_CONTENT_LENGTH, HTTP2_HEADER_CONTENT_TYPE
} = constants;

function lookupMime(filename: string, gzipped: boolean) {
    return lookupByPath(gzipped ? (filename.substr(0, filename.lastIndexOf('.'))) : filename);
}

/**
 * FIXME: If added before any other route somehow supresses errors thrown
 */
export default class StaticMiddleware extends RoutingMiddleware<XPressRouterContext, void, 'GET'> {
    private readonly rootFolder: string;
    private readonly filter?: RegExp;
    private readonly EMPTY_BUFFER = Buffer.from([]);

    constructor(rootFolder: string, {filter}: { filter?: RegExp } = {}) {
        super();
        this.rootFolder = resolve(rootFolder);
        this.filter = filter;
    }

    async handle(ctx: XPressRouterContext & IRouterContext<void, "ALL" | "GET" | null>): Promise<void> {
        if (ctx.stream.hasDataSent)
            return;
        const {stream, path} = ctx;
        let pathname = path;
        let gzippedFound = false;
        const normalFilePath = join(this.rootFolder, pathname);
        if (this.filter && !this.filter.test(pathname)) return;
        let filename = normalFilePath + '.gz';
        if (!stream.acceptsEncoding('gzip') || !(await exists(filename))) filename = normalFilePath;
        else gzippedFound = true;
        try {
            let stats = await stat(filename);
            if (stats.isDirectory()) return;
            // Can be <, but if client sends newer date, then file is changed to older?
            // No need to compare against eps
            if ((new Date(stream.reqHeaders[HTTP2_HEADER_IF_MODIFIED_SINCE] as string).getTime() - stats.mtime.getTime()) <= 0) {
                stream.resHeaders[HTTP2_HEADER_STATUS] = 304;
                stream.send(this.EMPTY_BUFFER);
                return;
            }
            let type = lookupMime(filename, gzippedFound);
            let charset = /^text\/|^application\/(javascript|json)/.test(type as string) ? 'UTF-8' : false;
            stream.resHeaders[HTTP2_HEADER_LAST_MODIFIED] = stats.mtime.toISOString();
            stream.resHeaders[HTTP2_HEADER_CACHE_CONTROL] = 'public, max-age=31536000';
            stream.resHeaders[HTTP2_HEADER_ETAG] = stats.mtime.getTime().toString(36);
            if (gzippedFound) stream.resHeaders[HTTP2_HEADER_CONTENT_ENCODING] = 'gzip';
            stream.resHeaders[HTTP2_HEADER_CONTENT_LENGTH] = stats.size;
            if (type) stream.resHeaders[HTTP2_HEADER_CONTENT_TYPE] = (type + (charset ? '; charset=' + charset : ''));
            stream.sendStream(createReadStream(filename));
        } catch (e) {
            // Next is not needed
            if (e.code !== 'ENOENT') throw e;
        }
    }
}