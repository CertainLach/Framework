"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const fs = require("fs");
const utils_1 = require("@meteor-it/utils");
const path_1 = require("path");
const util_1 = require("util");
function isDataUrl(path) {
    return /^data:.+\/.+;base64,/.test(path.substr(0, 268));
}
function parseDataUrl(path) {
    return {
        mime: path.slice(5, path.indexOf(';')),
        data: Buffer.from(path.slice(path.indexOf(',') + 1), 'base64')
    };
}
function readDir(dir) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield util_1.promisify(fs.readdir)(dir);
    });
}
exports.readDir = readDir;
function readFile(file) {
    return __awaiter(this, void 0, void 0, function* () {
        if (isDataUrl(file))
            return parseDataUrl(file).data;
        return yield util_1.promisify(fs.readFile)(file);
    });
}
exports.readFile = readFile;
function stat(file) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield util_1.promisify(fs.stat)(file);
    });
}
exports.stat = stat;
function open(file, mode, access) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield util_1.promisify(fs.open)(file, mode, access);
    });
}
exports.open = open;
function read(fd, buffer, offset, length, position) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield util_1.promisify(fs.read)(fd, buffer, offset, length, position);
    });
}
exports.read = read;
function close(fd) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield util_1.promisify(fs.close)(fd);
    });
}
exports.close = close;
function writeFile(filename, text) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield util_1.promisify(fs.writeFile)(filename, text);
    });
}
exports.writeFile = writeFile;
function walkDir(dir, cb) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!(yield exists(dir))) {
            throw new Error('No such file or directory: ' + dir);
        }
        let returnValue;
        let shouldReturn = false;
        if (!cb) {
            returnValue = [];
            shouldReturn = true;
            cb = (file, dir) => {
                returnValue.push(dir + path_1.sep + file);
            };
        }
        let dirList = [];
        yield utils_1.asyncEach(yield readDir(dir), (file) => __awaiter(this, void 0, void 0, function* () {
            let path = dir + path_1.sep + file;
            if (yield isFile(path)) {
                cb(file, dir);
            }
            else if (yield isDirectory(path)) {
                dirList.push(file);
            }
        }));
        yield utils_1.asyncEach(dirList, (dirLevelDown) => __awaiter(this, void 0, void 0, function* () {
            yield walkDir(dir + path_1.sep + dirLevelDown, cb);
        }));
        if (shouldReturn) {
            return returnValue.sort();
        }
        return;
    });
}
exports.walkDir = walkDir;
function exists(file) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let result = yield util_1.promisify(fs.access)(file, fs.constants.F_OK);
            if (result === undefined) {
                return true;
            }
        }
        catch (e) {
            return false;
        }
    });
}
exports.exists = exists;
function isFile(path) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield stat(path)).isFile();
    });
}
exports.isFile = isFile;
function isDirectory(path) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield stat(path)).isDirectory();
    });
}
exports.isDirectory = isDirectory;
function getReadStream(path, options = {}) {
    return fs.createReadStream(path, options);
}
exports.getReadStream = getReadStream;
function getWriteStream(path, options = {}) {
    return fs.createWriteStream(path, options);
}
exports.getWriteStream = getWriteStream;
//# sourceMappingURL=index.js.map