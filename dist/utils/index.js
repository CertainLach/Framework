var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
(function (dependencies, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    }
})(["require", "exports", "stream"], function (require, exports) {
    "use strict";
    var stream_1 = require("stream");
    // hello, world => Hello, world!
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
        var p = Object.keys(x);
        return Object.keys(y).every(function (i) { return p.indexOf(i) !== -1; }) && p.every(function (i) { return objectEquals(x[i], y[i]); });
    }
    exports.objectEquals = objectEquals;
    function flatten(array, result) {
        if (result === void 0) { result = []; }
        if (!(array instanceof Array))
            throw new TypeError('"array" argument is not a array!');
        for (var i = 0; i < array.length; i++) {
            var value = array[i];
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
        //if (!(array1 instanceof Array) || !!(array2 instanceof Array)) throw new TypeError('One of arguments is not a array! ('+(typeof array1)+', '+(typeof array2)+')');
        if (typeof array1 !== typeof array2)
            throw new TypeError('Both arguments must have same types!');
        var out;
        if (array1 instanceof Array) {
            out = [];
            for (var index in array1) {
                // noinspection JSUnfilteredForInLoop
                out.push([array1[index], array2[index]]);
            }
            return out;
        }
        else if (array1 instanceof Object) {
            out = {};
            for (var key in array1) {
                // noinspection JSUnfilteredForInLoop
                out[key] = array1[key];
            }
            for (var key in array2) {
                // noinspection JSUnfilteredForInLoop
                out[key] = array2[key];
            }
            return out;
        }
        else {
            throw new TypeError('Unknown input type!');
        }
    }
    exports.mix = mix;
    function createPrivateEnum() {
        var values = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            values[_i] = arguments[_i];
        }
        var returnObj = {};
        values.map(function (value) { return value.toUpperCase(); });
        values.forEach(function (value) { return returnObj[value] = Symbol(value); });
        return returnObj;
    }
    exports.createPrivateEnum = createPrivateEnum;
    function fixLength(string, length, insertPre, symbol) {
        if (insertPre === void 0) { insertPre = false; }
        if (symbol === void 0) { symbol = ' '; }
        return insertPre ? string.padStart(length, symbol) : string.padEnd(length, symbol);
    }
    exports.fixLength = fixLength;
    function objectMap(object, cb) {
        var ret = [];
        var keys = Object.keys(object);
        var values = Object.values(object);
        for (var i = 0; i < keys.length; i++)
            ret.push(cb(values[i], keys[i], object));
        return ret;
    }
    exports.objectMap = objectMap;
    function arrayKVObject(keys, values) {
        var len = keys.length;
        if (len !== values.length)
            throw new Error('Both arrays must have same length!');
        var result = {};
        for (var i = 0; i < len; i++)
            result[keys[i]] = values[i];
        return result;
    }
    exports.arrayKVObject = arrayKVObject;
    function sleep(time) {
        return new Promise(function (res) {
            setTimeout(res, time);
        });
    }
    exports.sleep = sleep;
    /**
     * Like iterable.map(cb),
     * but cb can be async
     * @param iterable Array to process
     * @param cb Function to do with each element
     */
    function asyncEach(iterable, cb) {
        var waitings = [];
        iterable.forEach(function (iter) {
            waitings.push(cb(iter));
        });
        return Promise.all(waitings);
    }
    exports.asyncEach = asyncEach;
    /**
     * Convert callback function to async
     * @param cbFunction Function to convert
     */
    function cb2promise(cbFunction) {
        return function () {
            var args = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                args[_i] = arguments[_i];
            }
            return new Promise(function (res, rej) {
                cbFunction.apply(void 0, args.concat([function (err, result) {
                        if (err)
                            return rej(err);
                        res(result);
                    }]));
            });
        };
    }
    exports.cb2promise = cb2promise;
    function hashCode(s) {
        var hash = 0;
        if (s.length === 0)
            return hash;
        for (var i = 0; i < s.length; i++) {
            var character = s.charCodeAt(i);
            hash = ((hash << 5) - hash) + character;
            hash = hash & hash;
        }
        return hash;
    }
    exports.hashCode = hashCode;
    function djb2Code(str) {
        var hash = 5381;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) + hash) + char; /* hash * 33 + c */
        }
        return hash;
    }
    exports.djb2Code = djb2Code;
    function sdbmCode(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = char + (hash << 6) + (hash << 16) - hash;
        }
        return hash;
    }
    exports.sdbmCode = sdbmCode;
    function loseCode(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            hash += str.charCodeAt(i);
        }
        return hash;
    }
    exports.loseCode = loseCode;
    function encodeHtmlSpecials(str) {
        var i = str.length;
        var aRet = [];
        while (i--) {
            var iC = str[i].charCodeAt();
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
    function createReadStream(object, options) {
        if (options === void 0) { options = {}; }
        return new MultiStream(object, options);
    }
    exports.createReadStream = createReadStream;
    function readStream(stream) {
        return new Promise(function (res, rej) {
            var bufs = [];
            stream.on('data', function (d) {
                bufs.push(d);
            });
            stream.on('end', function () {
                var buf = Buffer.concat(bufs);
                res(buf);
            });
            stream.on('error', rej);
        });
    }
    exports.readStream = readStream;
    var MultiStream = (function (_super) {
        __extends(MultiStream, _super);
        function MultiStream(object, options) {
            if (options === void 0) { options = {}; }
            var _this;
            if (object instanceof Buffer || typeof object === 'string') {
                _this = _super.call(this, {
                    highWaterMark: options.highWaterMark,
                    encoding: options.encoding
                }) || this;
            }
            else {
                _this = _super.call(this, {
                    objectMode: true
                }) || this;
            }
            _this._object = object;
            return _this;
        }
        MultiStream.prototype._read = function () {
            this.push(this._object);
            this._object = null;
        };
        return MultiStream;
    }(stream_1.Readable));
    exports.MultiStream = MultiStream;
});
//# sourceMappingURL=index.js.map