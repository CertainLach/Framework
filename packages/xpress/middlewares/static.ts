import { stat, getReadStream } from '@meteor-it/fs';
import {parse} from 'url';
import {join,resolve} from 'path';
import {lookup} from '@meteor-it/mime';

function lookupMime(filename, gzipped){
    let splitted=filename.split('.');
    if(gzipped){
        return lookup(splitted[splitted.length-2]);
    }else{
        return lookup(splitted[splitted.length-1]);
    }
}

export default function (rootFolder, gzipped) {
    return async (req, res, next) => {
        let pathname = parse(req.url).pathname;
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
            let type = lookup(filename.split('.').slice(-1)[0]);
            let charset = /^text\/|^application\/(javascript|json)/.test(type) ? 'UTF-8' : false;
            res.setHeader('Last-Modified', stats.mtime.toISOString());
            res.setHeader('Cache-Control', 'public, max-age=31536000');
            res.setHeader('ETag', stats.mtime.getTime().toString(36));
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