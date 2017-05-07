import util from 'util';
import {Readable} from 'stream';

export function createReadStream(object, options = {}) {
    return new MultiStream(object, options);
}
export function readStream(stream) {
    return new Promise((res, rej) => {
        var bufs = [];
        stream.on('data', function(d) {
            bufs.push(d);
        });
        stream.on('end', function() {
            let buf = Buffer.concat(bufs);
            res(buf);
        });
        stream.on('error',rej);
    });
}

export class MultiStream extends Readable {
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
