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
})(["require", "exports", "fs", "@meteor-it/utils", "path", "util"], function (require, exports) {
    "use strict";
    var fs = require("fs");
    var utils_1 = require("@meteor-it/utils");
    var path_1 = require("path");
    var util_1 = require("util");
    /**
     * Get all files in directory
     */
    function readDir(dir) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, util_1.promisify(fs.readdir)(dir)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    }
    exports.readDir = readDir;
    /**
     * Read file
     * @param file Path to file to read
     */
    function readFile(file) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, util_1.promisify(fs.readFile)(file)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    }
    exports.readFile = readFile;
    function stat(file) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, util_1.promisify(fs.stat)(file)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    }
    exports.stat = stat;
    function open(file, mode, access) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, util_1.promisify(fs.open)(file, mode, access)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    }
    exports.open = open;
    function read(fd, buffer, offset, length, position) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, util_1.promisify(fs.read)(fd, buffer, offset, length, position)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    }
    exports.read = read;
    function close(fd) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, util_1.promisify(fs.close)(fd)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    }
    exports.close = close;
    /**
     * Write text to file
     */
    function writeFile(filename, text) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, util_1.promisify(fs.writeFile)(filename, text)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    }
    exports.writeFile = writeFile;
    /**
     * Walk directory
     * @param dir Directory to walk
     * @param cb If provided, found files will returned realtime. If not - function will return all found files
     */
    function walkDir(dir, cb) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            var returnValue, shouldReturn, dirList, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, exists(dir)];
                    case 1:
                        if (!(_c.sent())) {
                            throw new Error('No such file or directory: ' + dir);
                        }
                        shouldReturn = false;
                        if (!cb) {
                            returnValue = [];
                            shouldReturn = true;
                            cb = function (file, dir) {
                                returnValue.push(dir + path_1.sep + file);
                            };
                        }
                        dirList = [];
                        _a = utils_1.asyncEach;
                        return [4 /*yield*/, readDir(dir)];
                    case 2: return [4 /*yield*/, _a.apply(void 0, [_c.sent(), function (file) { return __awaiter(_this, void 0, void 0, function () {
                                var path;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            path = dir + path_1.sep + file;
                                            return [4 /*yield*/, isFile(path)];
                                        case 1:
                                            if (!_a.sent())
                                                return [3 /*break*/, 2];
                                            cb(file, dir);
                                            return [3 /*break*/, 4];
                                        case 2: return [4 /*yield*/, isDirectory(path)];
                                        case 3:
                                            if (_a.sent()) {
                                                dirList.push(file);
                                            }
                                            _a.label = 4;
                                        case 4: return [2 /*return*/];
                                    }
                                });
                            }); }])];
                    case 3:
                        _c.sent();
                        return [4 /*yield*/, utils_1.asyncEach(dirList, function (dirLevelDown) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, walkDir(dir + path_1.sep + dirLevelDown, cb)];
                                        case 1:
                                            _a.sent();
                                            return [2 /*return*/];
                                    }
                                });
                            }); })];
                    case 4:
                        _c.sent();
                        if (shouldReturn) {
                            return [2 /*return*/, returnValue.sort()];
                        }
                        return [2 /*return*/];
                }
            });
        });
    }
    exports.walkDir = walkDir;
    /**
     * Check if file exists
     */
    function exists(file) {
        return __awaiter(this, void 0, void 0, function () {
            var result, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, util_1.promisify(fs.access)(file, fs.constants.F_OK)];
                    case 1:
                        result = _a.sent();
                        if (result === undefined) {
                            return [2 /*return*/, true];
                        }
                        return [3 /*break*/, 3];
                    case 2:
                        e_1 = _a.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    }
    exports.exists = exists;
    /**
     * Is path a file
     */
    function isFile(path) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, stat(path)];
                    case 1: return [2 /*return*/, (_a.sent()).isFile()];
                }
            });
        });
    }
    exports.isFile = isFile;
    /**
     * Is path a directory
     */
    function isDirectory(path) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, stat(path)];
                    case 1: return [2 /*return*/, (_a.sent()).isDirectory()];
                }
            });
        });
    }
    exports.isDirectory = isDirectory;
    /**
     * Wrapper to fs function
     */
    function getReadStream(path, options) {
        if (options === void 0) { options = {}; }
        return fs.createReadStream(path, options);
    }
    exports.getReadStream = getReadStream;
    /**
     * Wrapper to fs function
     */
    function getWriteStream(path, options) {
        if (options === void 0) { options = {}; }
        return fs.createWriteStream(path, options);
    }
    exports.getWriteStream = getWriteStream;
});
//# sourceMappingURL=index.js.map