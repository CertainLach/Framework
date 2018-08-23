/// <reference types="node" />
/**
 * Websocket wrapper with auto-reconnection
 */
export default class WebSocketClient {
    number: number;
    autoReconnectInterval: number;
    url: string;
    instance: WebSocket;
    safeClose: boolean;
    constructor(url: string, reconnectInterval?: number);
    /**
     * Opens connection
     */
    open(): void;
    /**
     * Closes connection
     */
    close(): void;
    sendBuffer: (string | Buffer)[];
    /**
     * Sends data to remote socket or saves to buffer if not available
     * @param data
     */
    send(data: string | Buffer): void;
    /**
     * Reconnects to a websocket
     */
    reconnect(): void;
    /**
     * After successful reconnection send all buffered data to remote
     */
    onOpenResend(): void;
    onopen(): void;
    onmessage(data: {
        data: Buffer | string;
    }, flags: number, number: number): void;
    onerror(e: Error): void;
    onclose(e: CloseEvent): void;
}
