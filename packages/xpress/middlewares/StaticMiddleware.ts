import path from 'path';
import http2 from "http2";
import fs from "fs";
import { exists, stat } from '@meteor-it/fs';
import { lookupByPath } from '@meteor-it/mime';
import { IRouterContext, RoutingMiddleware } from '@meteor-it/router';
import { XPressRouterContext } from '..';


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

    constructor(rootFolder: string, { filter }: { filter?: RegExp } = {}) {
        super();
        this.rootFolder = path.resolve(rootFolder);
        this.filter = filter;
    }

    async handle(ctx: XPressRouterContext & IRouterContext<void, "ALL" | "GET" | null>): Promise<void> {
        if (ctx.stream.hasDataSent)
            return;
        const { stream, path: pathname } = ctx;
        let gzippedFound = false;
        const normalFilePath = path.join(this.rootFolder, pathname);
        if (this.filter && !this.filter.test(pathname)) return;
        let filename = normalFilePath + '.gz';
        if (!stream.acceptsEncoding('gzip') || !(await exists(filename))) filename = normalFilePath;
        else gzippedFound = true;
        try {
            let stats = await stat(filename);
            if (stats.isDirectory()) return;
            // Can be <, but if client sends newer date, then file is changed to older?
            // No need to compare against eps
            if ((new Date(stream.reqHeaders[http2.constants.HTTP2_HEADER_IF_MODIFIED_SINCE] as string).getTime() - stats.mtime.getTime()) <= 0) {
                stream.resHeaders[http2.constants.HTTP2_HEADER_STATUS] = 304;
                stream.send(this.EMPTY_BUFFER);
                return;
            }
            let type = lookupMime(filename, gzippedFound);
            let charset = /^text\/|^application\/(javascript|json)/.test(type as string) ? 'UTF-8' : false;
            stream.resHeaders[http2.constants.HTTP2_HEADER_LAST_MODIFIED] = stats.mtime.toISOString();
            stream.resHeaders[http2.constants.HTTP2_HEADER_CACHE_CONTROL] = 'public, max-age=31536000';
            stream.resHeaders[http2.constants.HTTP2_HEADER_ETAG] = stats.mtime.getTime().toString(36);
            if (gzippedFound) stream.resHeaders[http2.constants.HTTP2_HEADER_CONTENT_ENCODING] = 'gzip';
            stream.resHeaders[http2.constants.HTTP2_HEADER_CONTENT_LENGTH] = stats.size;
            if (type) stream.resHeaders[http2.constants.HTTP2_HEADER_CONTENT_TYPE] = (type + (charset ? '; charset=' + charset : ''));
            stream.sendStream(fs.createReadStream(filename));
        } catch (e) {
            // Next is not needed
            if (e.code !== 'ENOENT') throw e;
        }
    }
}
