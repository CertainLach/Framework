"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const fs_1 = require("@meteor-it/fs");
const url_1 = require("url");
const path_1 = require("path");
const mime_1 = require("@meteor-it/mime");
function lookupMime(filename, gzipped) {
    let splitted = filename.split('.');
    if (gzipped) {
        return mime_1.lookup(splitted[splitted.length - 2]);
    }
    else {
        return mime_1.lookup(splitted[splitted.length - 1]);
    }
}
function default_1(rootFolder, gzipped) {
    return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        let pathname = url_1.parse(req.url).pathname;
        if (gzipped)
            pathname += '.gz';
        let filename = path_1.join(path_1.resolve(rootFolder), pathname);
        try {
            let stats = yield fs_1.stat(filename);
            if (stats.isDirectory()) {
                return next();
            }
            if ((new Date(req.headers['if-modified-since']).getTime() - stats.mtime.getTime()) === 0) {
                res.writeHead(304);
                return res.end();
            }
            let type = mime_1.lookup(filename.split('.').slice(-1)[0]);
            let charset = /^text\/|^application\/(javascript|json)/.test(type) ? 'UTF-8' : false;
            res.setHeader('Last-Modified', stats.mtime.toISOString());
            res.setHeader('Cache-Control', 'public, max-age=31536000');
            res.setHeader('ETag', stats.mtime.getTime().toString(36));
            res.setHeader('Content-Length', stats.size);
            if (type)
                res.setHeader('Content-Type', (type + (charset ? '; charset=' + charset : '')));
            fs_1.getReadStream(filename).pipe(res);
        }
        catch (e) {
            next();
        }
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
//# sourceMappingURL=static.js.map