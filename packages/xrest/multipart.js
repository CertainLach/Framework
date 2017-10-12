var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import { basename } from 'path';
import { close, open, read } from '@meteor-it/fs';
export var DEFAULT_BOUNDARY = '84921024METEORITXREST74819204';
var Stream = /** @class */ (function () {
    function Stream(stream) {
        if (this._isString(stream)) {
            this.string = '';
        }
        this.stream = stream;
    }
    Stream.prototype.write = function (data) {
        if (this.string !== undefined) {
            this.string += data;
        }
        else {
            this.stream.write(data, 'binary');
        }
    };
    Stream.prototype._isString = function (obj) {
        return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
    };
    return Stream;
}());
export { Stream };
var File = /** @class */ (function () {
    function File(path, filename, fileSize, encoding, contentType) {
        this.path = path;
        this.filename = filename || basename(path);
        this.fileSize = fileSize;
        this.encoding = encoding || 'binary';
        this.contentType = contentType || 'application/octet-stream';
    }
    return File;
}());
export { File };
var FileStream = /** @class */ (function () {
    function FileStream(stream, filename, dataLength, encoding, contentType) {
        if (encoding === void 0) { encoding = 'binary'; }
        if (contentType === void 0) { contentType = 'application/octet-stream'; }
        this.stream = stream;
        this.filename = filename;
        this.fileSize = dataLength;
        this.encoding = encoding;
        this.contentType = contentType;
    }
    return FileStream;
}());
export { FileStream };
var Data = /** @class */ (function (_super) {
    __extends(Data, _super);
    function Data(filename, contentType, data) {
        if (contentType === void 0) { contentType = 'application/octet-stream'; }
        return _super.call(this, createReadStream(data), filename, data.length, 'binary', contentType) || this;
    }
    return Data;
}(FileStream));
export { Data };
var Part = /** @class */ (function () {
    function Part(name, value, boundary) {
        this.name = name;
        this.value = value;
        this.boundary = boundary;
    }
    //returns the Content-Disposition header
    Part.prototype.header = function () {
        var header;
        if (this.value instanceof File) {
            header = "Content-Disposition: form-data; name='" + this.name + "'; filename='" + this.value.filename + "'\r\nContent-Length: " + this.value.fileSize + "\r\nContent-Type: " + this.value.contentType;
        }
        else if (this.value instanceof FileStream) {
            header = "Content-Disposition: form-data; name='" + this.name + "'; filename='" + this.value.filename + "'\r\nContent-Length: " + this.value.fileSize + "\r\nContent-Type: " + this.value.contentType;
        }
        else {
            header = "Content-Disposition: form-data; name='" + this.name + "'";
        }
        return "--" + this.boundary + "\r\n" + header + "\r\n\r\n";
    };
    //calculates the size of the Part
    Part.prototype.sizeOf = function () {
        var valueSize;
        if (this.value instanceof File) {
            valueSize = this.value.fileSize;
        }
        else if (this.value instanceof FileStream) {
            valueSize = this.value.fileSize;
        }
        else if (typeof this.value === 'number') {
            valueSize = this.value.toString().length;
        }
        else {
            valueSize = this.value.length;
        }
        return valueSize + this.header().length + 2;
    };
    // Writes the Part out to a writable stream that supports the write(data) method
    Part.prototype.write = function (stream) {
        var _this = this;
        return new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
            var fd, position, moreData, chunk, s;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!stream.on)
                            if (stream.stream)
                                stream = stream.stream;
                        //first write the Content-Disposition
                        stream.write(this.header());
                        if (!(this.value instanceof File)) return [3 /*break*/, 5];
                        return [4 /*yield*/, open(this.value.path, 'r', '0666')];
                    case 1:
                        fd = _a.sent();
                        position = 0;
                        moreData = true;
                        _a.label = 2;
                    case 2:
                        if (!moreData) return [3 /*break*/, 4];
                        chunk = new Buffer(4096);
                        return [4 /*yield*/, read(fd, chunk, 0, 4096, position)];
                    case 3:
                        _a.sent();
                        stream.write(chunk);
                        position += 4096;
                        if (chunk) {
                            moreData = true;
                        }
                        else {
                            stream.write('\r\n');
                            close(fd);
                            moreData = false;
                            resolve();
                        }
                        return [3 /*break*/, 2];
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        if (this.value instanceof FileStream) {
                            this.value.stream.on('end', function () {
                                stream.write('\r\n');
                                resolve();
                            });
                            s = this.value.stream.pipe(stream, {
                                end: false // Do not end writing streams, may be there is more data incoming
                            });
                        }
                        else {
                            stream.write(this.value + "\r\n");
                            resolve();
                        }
                        _a.label = 6;
                    case 6: return [2 /*return*/];
                }
            });
        }); });
    };
    return Part;
}());
export { Part };
var MultiPartRequest = /** @class */ (function () {
    function MultiPartRequest(data, boundary) {
        this.encoding = 'binary';
        this.boundary = boundary || DEFAULT_BOUNDARY;
        this.data = data;
        this.partNames = this._partNames();
    }
    MultiPartRequest.prototype._partNames = function () {
        var partNames = [];
        for (var name in this.data) {
            partNames.push(name);
        }
        return partNames;
    };
    MultiPartRequest.prototype.write = function (stream) {
        return __awaiter(this, void 0, void 0, function () {
            var partCount, partName, part;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        partCount = 0;
                        // wrap the stream in our own Stream object
                        // See the Stream function above for the benefits of this
                        stream = new Stream(stream);
                        _a.label = 1;
                    case 1:
                        if (!true) return [3 /*break*/, 3];
                        partName = this.partNames[partCount];
                        part = new Part(partName, this.data[partName], this.boundary);
                        return [4 /*yield*/, part.write(stream)];
                    case 2:
                        _a.sent();
                        partCount++;
                        if (partCount >= this.partNames.length) {
                            stream.write("--" + this.boundary + "--\r\n");
                            return [2 /*return*/, stream.string || ''];
                        }
                        return [3 /*break*/, 1];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return MultiPartRequest;
}());
export { MultiPartRequest };
export function sizeOf(parts, boundary) {
    if (boundary === void 0) { boundary = DEFAULT_BOUNDARY; }
    var totalSize = 0;
    for (var name in parts)
        totalSize += new Part(name, parts[name], boundary).sizeOf();
    return totalSize + boundary.length + 6;
}
export function write(stream, data, callback, boundary) {
    if (boundary === void 0) { boundary = DEFAULT_BOUNDARY; }
    return __awaiter(this, void 0, void 0, function () {
        var r;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    r = new MultiPartRequest(data, boundary);
                    return [4 /*yield*/, r.write(stream)];
                case 1:
                    _a.sent();
                    return [2 /*return*/, r];
            }
        });
    });
}
//# sourceMappingURL=multipart.js.map