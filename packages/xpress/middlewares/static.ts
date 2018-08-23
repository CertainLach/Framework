import {stat, getReadStream, exists} from '@meteor-it/fs';
import {join,resolve} from 'path';
import {lookupByPath} from '@meteor-it/mime';
import {IRouterContext} from '@meteor-it/router';
import {XPressRouterContext} from '../';

function lookupMime(filename:string, gzipped:boolean){
    return lookupByPath(gzipped?(filename.substr(0,filename.lastIndexOf('.'))):filename);
}

export default function (rootFolder:string, gzipped:boolean) {
    return async ({req,res,next,path}:IRouterContext<any>&XPressRouterContext) => {
        let pathname = path;
        if(gzipped)
            pathname+='.gz';
        let filename = join(resolve(rootFolder), pathname);
        try {
            let stats = await stat(filename);
            if (stats.isDirectory()) {
                return next();
            }
            // Can be <, but if client sends newer date, then file is changed to older?
            if ((new Date(req.headers['if-modified-since']).getTime() - stats.mtime.getTime()) === 0) {
                res.writeHead(304);
                return res.end();
            }
            let type = lookupMime(filename,gzipped);
            let charset = /^text\/|^application\/(javascript|json)/.test(type) ? 'UTF-8' : false;
            res.setHeader('Last-Modified', stats.mtime.toISOString());
            res.setHeader('Cache-Control', 'public, max-age=31536000');
            res.setHeader('ETag', stats.mtime.getTime().toString(36));
            if(gzipped)
                res.setHeader('Content-Encoding','gzip');
            res.setHeader('Content-Length', stats.size);
            if(type)
                res.setHeader('Content-Type', (type + (charset ? '; charset=' + charset : '')));
            getReadStream(filename).pipe(res);
        } catch (e) {
            // Any error = go next
            next();
        }
    };
}