import path from 'path';
import { open, read } from '@meteor-it/fs';
import { Readable as ReadableStream, Writable as WritableStream } from 'stream';

const { basename } = path;

export const DEFAULT_BOUNDARY = 'ce47607d67d74a658a058ba6697de227';
export class File {
    path: string;
    filename: string;
    fileSize: number;
    encoding: string;
    contentType: string;

    constructor(path: string, filename: string | null, fileSize: number, encoding: string = 'binary', contentType: string = 'application/octet-stream') {
        this.path = path;
        this.filename = filename || basename(path);
        this.fileSize = fileSize;
        this.encoding = encoding;
        this.contentType = contentType;
    }
}

export class FileStream {
    filename: string;
    fileSize: number;
    encoding: string;
    contentType: string;
    stream: ReadableStream;

    constructor(stream: ReadableStream, filename: string, dataLength: number, encoding: string = 'binary', contentType: string = 'application/octet-stream') {
        this.stream = stream;
        this.filename = filename;
        this.fileSize = dataLength;
        this.encoding = encoding;
        this.contentType = contentType;
    }
}

export type IPartData = File | FileStream | number | string;
export class Part {
    name: string;
    value: File | FileStream | number | string;
    boundary: string;

    constructor(name: string, value: IPartData, boundary: string) {
        this.name = name;
        this.value = value;
        this.boundary = boundary;
    }

    //returns the Content-Disposition header
    header(): string {
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
    sizeOf(): number {
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
    write(stream: WritableStream): Promise<void> {
        return new Promise(async (resolve) => {
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
                        await fd.close();
                        moreData = false;
                        resolve();
                    }
                }
            } else if (this.value instanceof FileStream) {
                this.value.stream.on('end', () => {
                    stream.write('\r\n');
                    resolve();
                });

                this.value.stream.pipe(stream, {
                    end: false // Do not end writing streams, may be there is more data incoming
                });
            } else {
                stream.write(`${this.value}\r\n`);
                resolve();
            }
        })
    }
}

export type IMultiPartData = { [key: string]: IPartData };
export class MultiPartRequest {
    encoding: string;
    boundary: string;
    data: IMultiPartData;
    private _partNames: string[];

    constructor(encoding: string = 'binary', data: IMultiPartData, boundary: string = DEFAULT_BOUNDARY) {
        this.encoding = encoding;
        this.boundary = boundary;
        this.data = data;
    }

    get partNames(): string[] {
        if (this._partNames)
            return this._partNames;
        this._partNames = [];
        for (const name in this.data) {
            this._partNames.push(name);
        }
        return this._partNames;
    }

    private async writePart(stream: WritableStream, partCount: number = 0): Promise<void> {
        let partName = this.partNames[partCount];
        let part = new Part(partName, this.data[partName], this.boundary);
        await part.write(stream);
        partCount++;
        if (partCount < this.partNames.length)
            await this.writePart(stream, partCount);
        else {
            stream.write(`--${this.boundary}--\r\n`);
        }
    }

    async write(stream: WritableStream): Promise<void> {
        await this.writePart(stream, 0);
    }
}


export function sizeOf(parts: IMultiPartData, boundary = DEFAULT_BOUNDARY): number {
    let totalSize = 0;
    for (let name in parts)
        totalSize += new Part(name, parts[name], boundary).sizeOf();
    return totalSize + boundary.length + 6;
}

export async function write(encoding: string = 'binary', stream: WritableStream, data: IMultiPartData, boundary = DEFAULT_BOUNDARY): Promise<MultiPartRequest> {
    let multiPartRequest = new MultiPartRequest(encoding, data, boundary);
    await multiPartRequest.write(stream);
    return multiPartRequest;
}