var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
(function (dependencies, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    }
})(["require", "exports", "@meteor-it/fs", "url", "path", "@meteor-it/mime"], function (require, exports) {
    "use strict";
    var fs_1 = require("@meteor-it/fs");
    var url_1 = require("url");
    var path_1 = require("path");
    var mime_1 = require("@meteor-it/mime");
    function lookupMime(filename, gzipped) {
        var splitted = filename.split('.');
        if (gzipped) {
            return mime_1.lookup(splitted[splitted.length - 2]);
        }
        else {
            return mime_1.lookup(splitted[splitted.length - 1]);
        }
    }
    function default_1(rootFolder, gzipped) {
        var _this = this;
        return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            var pathname, filename, stats, type, charset, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pathname = url_1.parse(req.url).pathname;
                        if (gzipped)
                            pathname += '.gz';
                        filename = path_1.join(path_1.resolve(rootFolder), pathname);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fs_1.stat(filename)];
                    case 2:
                        stats = _a.sent();
                        if (stats.isDirectory()) {
                            return [2 /*return*/, next()];
                        }
                        if (new Date(req.headers['if-modified-since']).getTime() - stats.mtime === 0) {
                            res.writeHead(304);
                            return [2 /*return*/, res.end()];
                        }
                        type = mime_1.lookup(filename);
                        charset = /^text\/|^application\/(javascript|json)/.test(type) ? 'UTF-8' : false;
                        res.setHeader('Last-Modified', stats.mtime);
                        res.setHeader('Content-Length', stats.size);
                        res.setHeader('Content-Type', type + (charset ? '; charset=' + charset : ''));
                        fs_1.getReadStream(filename).pipe(res);
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        next(e_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); };
    }
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = default_1;
});
//# sourceMappingURL=static.js.map