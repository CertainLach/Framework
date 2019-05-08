import { EventEmitter } from "events";
import * as http from 'http';
import { IClientOptions } from "./XPress";

declare class WebSocket extends EventEmitter {
	static CONNECTING: number;
	static OPEN: number;
	static CLOSING: number;
	static CLOSED: number;

	bytesReceived: number;
	readyState: number;
	protocolVersion: string;
	url: string;
	supports: any;
	upgradeReq: http.IncomingMessage;
	protocol: string;

	CONNECTING: number;
	OPEN: number;
	CLOSING: number;
	CLOSED: number;

	onopen: (event: { target: WebSocket }) => void;
	onerror: (err: Error) => void;
	onclose: (event: { wasClean: boolean; code: number; reason: string; target: WebSocket }) => void;
	onmessage: (event: { data: any; type: string; target: WebSocket }) => void;

	constructor(address: string, options?: IClientOptions);
	constructor(address: string, protocols?: string | string[], options?: IClientOptions);

	close(code?: number, data?: any): void;
	pause(): void;
	resume(): void;
	ping(data?: any, options?: { mask?: boolean; binary?: boolean }, dontFail?: boolean): void;
	pong(data?: any, options?: { mask?: boolean; binary?: boolean }, dontFail?: boolean): void;
	send(data: any, cb?: (err: Error) => void): void;
	send(data: any, options: { mask?: boolean; binary?: boolean }, cb?: (err: Error) => void): void;
	stream(options: { mask?: boolean; binary?: boolean }, cb?: (err: Error, final: boolean) => void): void;
	stream(cb?: (err: Error, final: boolean) => void): void;
	terminate(): void;

	// HTML5 WebSocket events
	addEventListener(method: 'message', cb?: (event: { data: any; type: string; target: WebSocket }) => void): void;
	addEventListener(method: 'close', cb?: (event: {
		wasClean: boolean; code: number;
		reason: string; target: WebSocket
	}) => void): void;
	addEventListener(method: 'error', cb?: (err: Error) => void): void;
	addEventListener(method: 'open', cb?: (event: { target: WebSocket }) => void): void;
	addEventListener(method: string, listener?: (...args: any[]) => void): void;

	// Events
	on(event: 'error', cb: (this: this, err: Error) => void): this;
	on(event: 'close', cb: (this: this, code: number, message: string) => void): this;
	on(event: 'message', cb: (this: this, data: any, flags: { binary: boolean }) => void): this;
	on(event: 'ping', cb: (this: this, data: any, flags: { binary: boolean }) => void): this;
	on(event: 'pong', cb: (this: this, data: any, flags: { binary: boolean }) => void): this;
	on(event: 'open', cb: (this: this) => void): this;
	on(event: string, listener: (this: this, ...args: any[]) => void): this;

	addListener(event: 'error', cb: (err: Error) => void): this;
	addListener(event: 'close', cb: (code: number, message: string) => void): this;
	addListener(event: 'message', cb: (data: any, flags: { binary: boolean }) => void): this;
	addListener(event: 'ping', cb: (data: any, flags: { binary: boolean }) => void): this;
	addListener(event: 'pong', cb: (data: any, flags: { binary: boolean }) => void): this;
	addListener(event: 'open', cb: () => void): this;
	addListener(event: string, listener: (...args: any[]) => void): this;
}

export default WebSocket;
