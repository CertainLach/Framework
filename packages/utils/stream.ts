import { Readable } from 'stream';

// noinspection JSUnusedGlobalSymbols
export function createReadStream(object: Buffer, options = {}): MultiStream {
    return new MultiStream(object, options);
}

// noinspection JSUnusedGlobalSymbols
export function readStreamToBuffer(stream: Readable, maxSize: number = 0): Promise<Buffer> {
    return new Promise((res, rej) => {
        const bufs: any = [];
        let size = 0;
        stream.on('data', d => {
            if (size + d.length > maxSize) {
                rej(new Error('Max buffer size exceeded'));
                return;
            }
            bufs.push(d);
            size += d.length;
        });
        stream.on('end', () => {
            res(Buffer.concat(bufs));
        });
        stream.on('error', rej);
    });
}

export interface IMultiStreamOptions {
    highWaterMark?: number;
    encoding?: string;
}

export class MultiStream extends Readable {
    private object: Buffer | null;
    constructor(object: Buffer, options: IMultiStreamOptions = {}) {
        super({
            highWaterMark: options.highWaterMark,
            encoding: options.encoding
        });
        this.object = object;
    }

    // noinspection JSUnusedGlobalSymbols
    _read() {
        this.push(this.object);
        this.object = null;
    }
}
