"use strict";
const stream_1 = require("stream");
function firstUppercase(str) {
    return str.substr(0, 1).toUpperCase() + str.substr(1);
}
exports.firstUppercase = firstUppercase;
function objectEquals(x, y) {
    if (x === null || x === undefined || y === null || y === undefined) {
        return x === y;
    }
    if (x.constructor !== y.constructor) {
        return false;
    }
    if (x instanceof Function) {
        return x === y;
    }
    if (x instanceof RegExp) {
        return x === y;
    }
    if (x === y || x.valueOf() === y.valueOf()) {
        return true;
    }
    if (Array.isArray(x) && x.length !== y.length) {
        return false;
    }
    if (x instanceof Date) {
        return false;
    }
    if (!(x instanceof Object)) {
        return false;
    }
    if (!(y instanceof Object)) {
        return false;
    }
    let p = Object.keys(x);
    return Object.keys(y).every(i => p.indexOf(i) !== -1) && p.every(i => objectEquals(x[i], y[i]));
}
exports.objectEquals = objectEquals;
function flatten(array, result = []) {
    if (!(array instanceof Array))
        throw new TypeError('"array" argument is not a array!');
    for (let i = 0; i < array.length; i++) {
        const value = array[i];
        if (Array.isArray(value)) {
            flatten(value, result);
        }
        else {
            result.push(value);
        }
    }
    return result;
}
exports.flatten = flatten;
function removeDuplicates(array) {
    if (!(array instanceof Array))
        throw new TypeError('"array" argument is not a array!');
    return Array.from(new Set(array));
}
exports.removeDuplicates = removeDuplicates;
function mix(array1, array2) {
    if (typeof array1 !== typeof array2)
        throw new TypeError('Both arguments must have same types!');
    let out;
    if (array1 instanceof Array) {
        out = [];
        for (let index in array1) {
            out.push([array1[index], array2[index]]);
        }
        return out;
    }
    else if (array1 instanceof Object) {
        out = {};
        for (let key in array1) {
            out[key] = array1[key];
        }
        for (let key in array2) {
            out[key] = array2[key];
        }
        return out;
    }
    else {
        throw new TypeError('Unknown input type!');
    }
}
exports.mix = mix;
function createPrivateEnum(...values) {
    let returnObj = {};
    values.map(value => value.toUpperCase());
    values.forEach(value => returnObj[value] = Symbol(value));
    return returnObj;
}
exports.createPrivateEnum = createPrivateEnum;
function fixLength(string, length, insertPre = false, symbol = ' ') {
    return insertPre ? string.padStart(length, symbol) : string.padEnd(length, symbol);
}
exports.fixLength = fixLength;
function objectMap(object, cb) {
    let ret = [];
    let keys = Object.keys(object);
    let values = Object.values(object);
    for (let i = 0; i < keys.length; i++)
        ret.push(cb(values[i], keys[i], object));
    return ret;
}
exports.objectMap = objectMap;
function arrayKVObject(keys, values) {
    let len = keys.length;
    if (len !== values.length)
        throw new Error('Both arrays must have same length!');
    let result = {};
    for (let i = 0; i < len; i++)
        result[keys[i]] = values[i];
    return result;
}
exports.arrayKVObject = arrayKVObject;
function sleep(time) {
    return new Promise((res) => {
        setTimeout(res, time);
    });
}
exports.sleep = sleep;
function asyncEach(iterable, cb) {
    let waitings = [];
    iterable.forEach(iter => {
        waitings.push(cb(iter));
    });
    return Promise.all(waitings);
}
exports.asyncEach = asyncEach;
function cb2promise(cbFunction) {
    return (...args) => {
        return new Promise((res, rej) => {
            cbFunction(...args, (err, result) => {
                if (err)
                    return rej(err);
                res(result);
            });
        });
    };
}
exports.cb2promise = cb2promise;
function hashCode(s) {
    let hash = 0;
    if (s.length === 0)
        return hash;
    for (let i = 0; i < s.length; i++) {
        let character = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + character;
        hash = hash & hash;
    }
    return hash;
}
exports.hashCode = hashCode;
function djb2Code(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        let char = str.charCodeAt(i);
        hash = ((hash << 5) + hash) + char;
    }
    return hash;
}
exports.djb2Code = djb2Code;
function sdbmCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        let char = str.charCodeAt(i);
        hash = char + (hash << 6) + (hash << 16) - hash;
    }
    return hash;
}
exports.sdbmCode = sdbmCode;
function loseCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash += str.charCodeAt(i);
    }
    return hash;
}
exports.loseCode = loseCode;
function encodeHtmlSpecials(str) {
    let i = str.length;
    let aRet = [];
    while (i--) {
        let iC = str[i].charCodeAt();
        if (iC < 65 || iC > 127 || (iC > 90 && iC < 97)) {
            aRet[i] = '&#' + iC + ';';
        }
        else {
            aRet[i] = str[i];
        }
    }
    return aRet.join('');
}
exports.encodeHtmlSpecials = encodeHtmlSpecials;
function createReadStream(object, options = {}) {
    return new MultiStream(object, options);
}
exports.createReadStream = createReadStream;
function readStream(stream) {
    return new Promise((res, rej) => {
        const bufs = [];
        stream.on('data', d => {
            bufs.push(d);
        });
        stream.on('end', () => {
            let buf = Buffer.concat(bufs);
            res(buf);
        });
        stream.on('error', rej);
    });
}
exports.readStream = readStream;
class MultiStream extends stream_1.Readable {
    constructor(object, options = {}) {
        if (object instanceof Buffer || typeof object === 'string') {
            super({
                highWaterMark: options.highWaterMark,
                encoding: options.encoding
            });
        }
        else {
            super({
                objectMode: true
            });
        }
        this._object = object;
    }
    _read() {
        this.push(this._object);
        this._object = null;
    }
}
exports.MultiStream = MultiStream;
//# sourceMappingURL=index.js.map