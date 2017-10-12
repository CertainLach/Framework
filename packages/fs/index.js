var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
import * as fs from 'fs';
import { asyncEach } from '@meteor-it/utils';
import { sep } from 'path';
import { promisify } from 'util';
// TODO: Data url: Support encoding and not base64 format
/**
 * Returns true if path is a valid data url
 * @param path path
 */
function isDataUrl(path) {
    return /^data:.+\/.+;base64,/.test(path.substr(0, 268));
}
/**
 * Returns mime and data of dataurl
 * @param path Data url
 */
function parseDataUrl(path) {
    return {
        mime: path.slice(5, path.indexOf(';')),
        data: Buffer.from(path.slice(path.indexOf(',') + 1), 'base64')
    };
}
/**
 * Get all files in directory
 */
export function readDir(dir) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, promisify(fs.readdir)(dir)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
/**
 * Read file or parse data url
 * @param file Path to file to read
 */
export function readFile(file) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (isDataUrl(file))
                        return [2 /*return*/, parseDataUrl(file).data];
                    return [4 /*yield*/, promisify(fs.readFile)(file)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
export function stat(file) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, promisify(fs.stat)(file)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
export function open(file, mode, access) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, promisify(fs.open)(file, mode, access)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
export function read(fd, buffer, offset, length, position) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, promisify(fs.read)(fd, buffer, offset, length, position)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
export function close(fd) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, promisify(fs.close)(fd)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
/**
 * Write text to file
 */
export function writeFile(filename, text) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, promisify(fs.writeFile)(filename, text)];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
/**
 * Walk directory
 * @param dir Directory to walk
 * @param cb If provided, found files will returned realtime. If not - function will return all found files
 */
export function walkDir(dir, cb) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        var returnValue, shouldReturn, dirList, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, exists(dir)];
                case 1:
                    if (!(_b.sent())) {
                        throw new Error('No such file or directory: ' + dir);
                    }
                    shouldReturn = false;
                    if (!cb) {
                        returnValue = [];
                        shouldReturn = true;
                        cb = function (file, dir) {
                            returnValue.push(dir + sep + file);
                        };
                    }
                    dirList = [];
                    _a = asyncEach;
                    return [4 /*yield*/, readDir(dir)];
                case 2: return [4 /*yield*/, _a.apply(void 0, [_b.sent(), function (file) { return __awaiter(_this, void 0, void 0, function () {
                            var path;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        path = dir + sep + file;
                                        return [4 /*yield*/, isFile(path)];
                                    case 1:
                                        if (!_a.sent()) return [3 /*break*/, 2];
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
                    _b.sent();
                    return [4 /*yield*/, asyncEach(dirList, function (dirLevelDown) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, walkDir(dir + sep + dirLevelDown, cb)];
                                    case 1:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 4:
                    _b.sent();
                    if (shouldReturn) {
                        return [2 /*return*/, returnValue.sort()];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
/**
 * Check if file exists
 */
export function exists(file) {
    return __awaiter(this, void 0, void 0, function () {
        var result, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, promisify(fs.access)(file, fs.constants.F_OK)];
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
/**
 * Is path a file
 * @param path path to test
 */
export function isFile(path) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, stat(path)];
                case 1: return [2 /*return*/, (_a.sent()).isFile()];
            }
        });
    });
}
/**
 * Is path a directory
 */
export function isDirectory(path) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, stat(path)];
                case 1: return [2 /*return*/, (_a.sent()).isDirectory()];
            }
        });
    });
}
/**
 * Wrapper to fs function
 */
export function getReadStream(path, options) {
    if (options === void 0) { options = {}; }
    return fs.createReadStream(path, options);
}
/**
 * Wrapper to fs function
 */
export function getWriteStream(path, options) {
    if (options === void 0) { options = {}; }
    return fs.createWriteStream(path, options);
}
//# sourceMappingURL=index.js.map