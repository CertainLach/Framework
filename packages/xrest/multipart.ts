import {basename} from 'path';
import {close, open, read} from '@meteor-it/fs';
import {Readable as ReadableStream} from 'stream';
import {getReadStream} from '@meteor-it/fs';

export const DEFAULT_BOUNDARY = '84921024METEORITXREST74819204';

export class Stream {
    stream;
    string;

    constructor(stream) {
        if (this._isString(stream)) {
            this.string = '';
        }
        this.stream = stream;
    }

    write(data) {
        if (this.string !== undefined) {
            this.string += data;
        } else {
            this.stream.write(data, 'binary');
        }
    }

    _isString(obj) {
        return !!(obj === '' || (obj && obj.charCodeAt && obj.substr));
    }
}

export class File {
    path;
    filename;
    fileSize;
    encoding;
    contentType;

    constructor(path, filename, fileSize, encoding, contentType) {
        this.path = path;
        this.filename = filename || basename(path);
        this.fileSize = fileSize;
        this.encoding = encoding || 'binary';
        this.contentType = contentType || 'application/octet-stream';
    }
}

export class FileStream {
    filename;
    fileSize;
    encoding;
    contentType;
    stream: ReadableStream;

    constructor(stream:ReadableStream, filename:string, dataLength:number, encoding:string = 'binary', contentType:string = 'application/octet-stream') {
        this.stream = stream;
        this.filename = filename;
        this.fileSize = dataLength;
        this.encoding = encoding;
        this.contentType = contentType;
    }
}

export class Data extends FileStream {
    constructor(filename:string, contentType:string = 'application/octet-stream', data:any) {
        super(createReadStream(data), filename, data.length, 'binary', contentType);
    }
}

export class Part {
    name;
    value;
    boundary;

    constructor(name, value, boundary) {
        this.name = name;
        this.value = value;
        this.boundary = boundary;
    }

    //returns the Content-Disposition header
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

    //calculates the size of the Part
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

    // Writes the Part out to a writable stream that supports the write(data) method
    write(stream) {
        return new Promise(async (resolve, reject) => {
            if (!stream.on)
                if (stream.stream)
                    stream = stream.stream;
            //first write the Content-Disposition
            stream.write(this.header());

            //Now write out the body of the Part
            if (this.value instanceof File) {
                let fd = await open(this.value.path, 'r', '0666');
                let position = 0;
                let moreData = true;
                while (moreData) {
                    let chunk = new Buffer(4096);
                    await read(fd, chunk, 0, 4096, position);
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
                }
            } else if (this.value instanceof FileStream) {
                this.value.stream.on('end', () => {
                    stream.write('\r\n');
                    resolve();
                });

                let s = this.value.stream.pipe(stream, {
                    end: false // Do not end writing streams, may be there is more data incoming
                });
            } else {
                stream.write(`${this.value}\r\n`);
                resolve();
            }
        })
    }
}

export class MultiPartRequest {
    encoding;
    boundary;
    data;
    partNames;

    constructor(data, boundary) {
        this.encoding = 'binary';
        this.boundary = boundary || DEFAULT_BOUNDARY;
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

    async write(stream) {
        let partCount = 0;
        // wrap the stream in our own Stream object
        // See the Stream function above for the benefits of this
        stream = new Stream(stream);
        while (true) {
            const partName = this.partNames[partCount];
            const part = new Part(partName, this.data[partName], this.boundary);
            await part.write(stream);
            partCount++;
            if (partCount >= this.partNames.length) {
                stream.write(`--${this.boundary}--\r\n`);
                return stream.string || '';
            }
        }
    }
}


export function sizeOf(parts, boundary = DEFAULT_BOUNDARY) {
    let totalSize = 0;
    for (let name in parts)
        totalSize += new Part(name, parts[name], boundary).sizeOf();
    return totalSize + boundary.length + 6;
}

export async function write(stream, data, callback, boundary=DEFAULT_BOUNDARY) {
    let r = new MultiPartRequest(data, boundary);
    await r.write(stream);
    return r;
}