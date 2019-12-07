import * as events from 'events';
import * as stream from 'stream';
import { Readable } from 'stream';

export class Speedometer {
	per: number;
	lasttime: number | null;
	total: number;
	iteration: number;
	speed: number;
	avg: number;
	constructor(per: number) {
		this.per = per;
		this.lasttime = null;
		this.total = 0;
		this.iteration = 0;
		this.speed = 0;
		this.avg = 0;
	}

	update(data: Buffer, callback: (speed: number, avg: number) => void) {
		const now = Date.now();
		if (this.lasttime === null) {
			this.lasttime = now;
			return;
		}
		const speed = Math.round((data.length / (now - this.lasttime)) * this.per);
		this.lasttime = now;
		this.total += speed;
		const avg = Math.round(this.total / ++this.iteration);

		const change = this.speed !== speed || this.avg !== avg;
		this.speed = speed;
		this.avg = avg;
		if (change) {
			callback(speed, avg);
		}
	}
}


export type IWrappedStream = {
	stream: Readable;
	speed: number;
	avg: number;
	cleanup: any;
}
export class StreamSpeed extends events.EventEmitter {
	per: number;
	private streams: IWrappedStream[];
	speed: number;
	avg: number;

	constructor(per: number = 1000) {
		super();
		this.per = per;
		this.streams = [];
		this.speed = 0;
		this.avg = 0;
	}

	update(meta: any, speed: number, avg: number) {
		meta.speed = speed;
		meta.avg = avg;

		this.streams.forEach((m) => {
			// Skip own stream, streams that haven't started,
			// and streams that are paused.
			if (m === meta || m.speed === 0 || m.stream.isPaused()) {
				return;
			}

			// Add other streams' speeds to total.
			speed += m.speed;
			avg += m.avg;
		});

		this.speed = speed;
		this.avg = avg;
		this.emit('speed', speed, avg);
	}

	getStreams(): Readable[] {
		return this.streams.map(m => m.stream);
	}

	add(origstream: Readable) {
		// Check if stream is already in group.
		if (this.streams.some(m => m.stream === origstream)) {
			throw Error('Stream already in group');
		}

		let passThroughStream: stream.PassThrough;

		const onReadable = () => {
			const data = passThroughStream.read();
			if (data) {
				reader.update(data, onUpdate);
			}
		};

		const cleanup = () => {
			passThroughStream.removeListener('readable', onReadable);
			passThroughStream.removeListener('end', cleanup);
			origstream.removeListener('error', cleanup);
			this.streams.splice(this.streams.indexOf(meta), 1);
		};

		const meta = {
			stream: origstream,
			speed: 0,
			avg: 0,
			cleanup,
		};
		this.streams.push(meta);
		const reader = new Speedometer(this.per);
		passThroughStream = origstream.pipe(new stream.PassThrough());
		const onUpdate = this.update.bind(this, meta);

		passThroughStream.on('readable', onReadable);
		passThroughStream.on('end', cleanup);
		origstream.on('error', cleanup);
	}

	remove(stream: Readable) {
		// Check if stream is in group.
		const meta = this.streams.find(m => m.stream === stream);
		if (!meta) {
			throw Error('Stream not found in group');
		}
		meta.cleanup();
	}
};
