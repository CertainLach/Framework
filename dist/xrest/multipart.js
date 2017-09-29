"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const path_1 = require("path");
const fs_1 = require("@meteor-it/fs");
exports.DEFAULT_BOUNDARY = '84921024METEORITXREST74819204';
class Stream {
    constructor(stream) {
        if (this._isString(stream)) {
            this.string = '';
        }
        this.stream = stream;
    }
    write(data) {
        if (this.string !== undefined) {
            this.string += data;
        }
        else {
            this.stream.write(data, 'binary');
        }
    }
    _isString(obj) {
        return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
    }
}
exports.Stream = Stream;
class File {
    constructor(path, filename, fileSize, encoding, contentType) {
        this.path = path;
        this.filename = filename || path_1.basename(path);
        this.fileSize = fileSize;
        this.encoding = encoding || 'binary';
        this.contentType = contentType || 'application/octet-stream';
    }
}
exports.File = File;
class FileStream {
    constructor(stream, filename, dataLength, encoding = 'binary', contentType = 'application/octet-stream') {
        this.stream = stream;
        this.filename = filename;
        this.fileSize = dataLength;
        this.encoding = encoding;
        this.contentType = contentType;
    }
}
exports.FileStream = FileStream;
class Data extends FileStream {
    constructor(filename, contentType = 'application/octet-stream', data) {
        super(createReadStream(data), filename, data.length, 'binary', contentType);
    }
}
exports.Data = Data;
class Part {
    constructor(name, value, boundary) {
        this.name = name;
        this.value = value;
        this.boundary = boundary;
    }
    header() {
        let header;
        if (this.value instanceof File) {
            header = `Content-Disposition: form-data; name='${this.name}'; filename='${this.value.filename}'\r\nContent-Length: ${this.value.fileSize}\r\nContent-Type: ${this.value.contentType}`;
        }
        else if (this.value instanceof FileStream) {
            header = `Content-Disposition: form-data; name='${this.name}'; filename='${this.value.filename}'\r\nContent-Length: ${this.value.fileSize}\r\nContent-Type: ${this.value.contentType}`;
        }
        else {
            header = `Content-Disposition: form-data; name='${this.name}'`;
        }
        return `--${this.boundary}\r\n${header}\r\n\r\n`;
    }
    sizeOf() {
        let valueSize;
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
    }
    write(stream) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            if (!stream.on)
                if (stream.stream)
                    stream = stream.stream;
            stream.write(this.header());
            if (this.value instanceof File) {
                let fd = yield fs_1.open(this.value.path, 'r', '0666');
                let position = 0;
                let moreData = true;
                while (moreData) {
                    let chunk = new Buffer(4096);
                    yield fs_1.read(fd, chunk, 0, 4096, position);
                    stream.write(chunk);
                    position += 4096;
                    if (chunk) {
                        moreData = true;
                    }
                    else {
                        stream.write('\r\n');
                        fs_1.close(fd);
                        moreData = false;
                        resolve();
                    }
                }
            }
            else if (this.value instanceof FileStream) {
                this.value.stream.on('end', () => {
                    stream.write('\r\n');
                    resolve();
                });
                let s = this.value.stream.pipe(stream, {
                    end: false
                });
            }
            else {
                stream.write(`${this.value}\r\n`);
                resolve();
            }
        }));
    }
}
exports.Part = Part;
class MultiPartRequest {
    constructor(data, boundary) {
        this.encoding = 'binary';
        this.boundary = boundary || exports.DEFAULT_BOUNDARY;
        this.data = data;
        this.partNames = this._partNames();
    }
    _partNames() {
        const partNames = [];
        for (const name in this.data) {
            partNames.push(name);
        }
        return partNames;
    }
    write(stream) {
        return __awaiter(this, void 0, void 0, function* () {
            let partCount = 0;
            stream = new Stream(stream);
            while (true) {
                const partName = this.partNames[partCount];
                const part = new Part(partName, this.data[partName], this.boundary);
                yield part.write(stream);
                partCount++;
                if (partCount >= this.partNames.length) {
                    stream.write(`--${this.boundary}--\r\n`);
                    return stream.string || '';
                }
            }
        });
    }
}
exports.MultiPartRequest = MultiPartRequest;
function sizeOf(parts, boundary = exports.DEFAULT_BOUNDARY) {
    let totalSize = 0;
    for (let name in parts)
        totalSize += new Part(name, parts[name], boundary).sizeOf();
    return totalSize + boundary.length + 6;
}
exports.sizeOf = sizeOf;
function write(stream, data, callback, boundary = exports.DEFAULT_BOUNDARY) {
    return __awaiter(this, void 0, void 0, function* () {
        let r = new MultiPartRequest(data, boundary);
        yield r.write(stream);
        return r;
    });
}
exports.write = write;
//# sourceMappingURL=multipart.js.map