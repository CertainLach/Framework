import { exists, walkDirArray } from '@meteor-it/fs';
import { lookupByPath } from '@meteor-it/mime';
import { IRouterContext, RoutingMiddleware } from '@meteor-it/router';
import { createReadStream, Stats } from 'fs';
import { readFile, stat } from 'fs/promises';
import * as http2 from "http2";
import * as path from 'path';
import { XPressRouterContext, XpressRouterStream } from '..';

function lookupMime(filename: string, gzipped: boolean) {
    return lookupByPath(gzipped ? (filename.substr(0, filename.lastIndexOf('.'))) : filename);
}

type ICachedFile = {
    headers: any,
    timeModified: number,
    contents: Buffer
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

    private cached: Map<string, ICachedFile> = new Map();
    private hasCachePrepared: boolean = false;
    /**
     * Experimental: Read all the files into ram to faster access to them in future
     */
    async prepareCache() {
        if (process.env.DO_NOT_PREPARE_CACHE) return;
        const fileList = (await walkDirArray(this.rootFolder)).map(e => path.relative(this.rootFolder, e));
        const tasks = [];
        for (let file of fileList) {
            tasks.push((async () => {
                if (this.filter && !this.filter.test(path.basename(file))) return;
                const stats = await stat(path.join(this.rootFolder, file));
                const headers = {};
                this.fillHeader(headers, file, file.endsWith('.gz'), stats);
                const contents = await readFile(path.join(this.rootFolder, file));
                const timeModified = stats.mtime.getTime();
                const cachedFile: ICachedFile = { headers, contents, timeModified };
                this.cached.set(file, cachedFile);
            })());
        }
        await Promise.all(tasks);
        this.hasCachePrepared = true;
    }

    fillHeader(headers: any, filename: string, gzippedFound: boolean, stats: Stats) {
        let type = lookupMime(filename, gzippedFound);
        let charset = /^text\/|^application\/(javascript|json)/.test(type as string) ? 'UTF-8' : false;
        headers[http2.constants.HTTP2_HEADER_LAST_MODIFIED] = stats.mtime.toISOString();
        headers[http2.constants.HTTP2_HEADER_CACHE_CONTROL] = 'public, max-age=31536000';
        headers[http2.constants.HTTP2_HEADER_ETAG] = stats.mtime.getTime().toString(36);
        if (gzippedFound) headers[http2.constants.HTTP2_HEADER_CONTENT_ENCODING] = 'gzip';
        headers[http2.constants.HTTP2_HEADER_CONTENT_LENGTH] = stats.size;
        if (type) headers[http2.constants.HTTP2_HEADER_CONTENT_TYPE] = (type + (charset ? '; charset=' + charset : ''));
    }

    async serve(pathname: string, stream: XpressRouterStream) {
        if (this.hasCachePrepared) {
            pathname = pathname.replace(/^\/+/g, '');
            if (!this.cached.has(pathname)) return;
            if (stream.acceptsEncoding('gzip') && this.cached.has(pathname + '.gz')) {
                pathname += '.gz';
            }
            const cached = this.cached.get(pathname)!;
            if ((http2.constants.HTTP2_HEADER_IF_MODIFIED_SINCE in stream.reqHeaders) && (new Date(stream.reqHeaders[http2.constants.HTTP2_HEADER_IF_MODIFIED_SINCE] as string).getTime() - cached.timeModified) <= 0) {
                stream.resHeaders[http2.constants.HTTP2_HEADER_STATUS] = 304;
                stream.send(this.EMPTY_BUFFER);
                return;
            }
            Object.assign(stream.resHeaders, cached.headers);
            stream.send(cached.contents);
        } else {
            let gzippedFound = false;
            const normalFilePath = path.join(this.rootFolder, pathname);
            if (this.filter && !this.filter.test(path.basename(pathname))) return;
            let filename = normalFilePath + '.gz';
            if (!stream.acceptsEncoding('gzip') || !(await exists(filename))) filename = normalFilePath;
            else gzippedFound = true;
            try {
                let stats = await stat(filename);
                if (stats.isDirectory()) return;
                // Can be <, but if client sends newer date, then file is changed to older?
                // No need to compare against eps
                if ((http2.constants.HTTP2_HEADER_IF_MODIFIED_SINCE in stream.reqHeaders) && (new Date(stream.reqHeaders[http2.constants.HTTP2_HEADER_IF_MODIFIED_SINCE] as string).getTime() - stats.mtime.getTime()) <= 0) {
                    stream.resHeaders[http2.constants.HTTP2_HEADER_STATUS] = 304;
                    stream.send(this.EMPTY_BUFFER);
                    return;
                }
                this.fillHeader(stream.resHeaders, filename, gzippedFound, stats);
                stream.sendStream(createReadStream(filename));
            } catch (e) {
                // Next is not needed
                if (e.code !== 'ENOENT') throw e;
            }
        }
    }

    async handle(ctx: XPressRouterContext & IRouterContext<void, "ALL" | "GET" | null>): Promise<void> {
        if (ctx.stream.hasDataSent)
            return;
        const { stream, path: pathname } = ctx;
        await this.serve(pathname, stream);
    }
}
