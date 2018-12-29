/**
 * Websocket wrapper with auto-reconnection
 */
export default class WebSocketClient {
    number: number = 0; // Message id
    autoReconnectInterval: number;
    url: string;
    instance: WebSocket;
    safeClose = false;

    /**
     * Auto-reconnecting websocket wrapper
     * @param url Websocket url (with protocol)
     * @param reconnectInterval Interval on which websocket will auto-reconnect
     */
    constructor(url: string, reconnectInterval: number = 100) {
        this.autoReconnectInterval = reconnectInterval; // ms
        this.url = url;
    }

    /**
     * Opens connection
     */
    open() {
        this.safeClose = false;
        this.instance = new WebSocket(this.url);
        this.instance.binaryType = 'arraybuffer';
        this.instance.onopen = () => {
            this.onOpenResend();
            this.onopen();
        };
        (this.instance as any).onmessage = (data: any, flags: number) => {
            this.number++;
            this.onmessage(data, flags, this.number);
        };
        this.instance.onclose = (e) => {
            if (!this.safeClose) {
                switch (e.code) {
                    case 1000: // CLOSE_NORMAL
                        this.onclose(e);
                        break;
                    default: // Abnormal closure
                        this.reconnect();
                        break;
                }
            } else {
                this.onclose(e);
            }
        };
        this.instance.onerror = (e) => {
            switch ((e as any).code) {
                case 'ECONNREFUSED':
                    if (!this.safeClose)
                        this.reconnect();
                    else
                        this.onerror(e as any);
                    break;
                default:
                    this.onerror(e as any);
                    break;
            }
        };
    }

    /**
     * Closes connection
     */
    close() {
        this.safeClose = true;
        this.instance.close();
    }

    private sendBuffer: (string | Buffer)[] = [];

    /**
     * Sends data to remote socket or saves to buffer if not available
     * @param data
     */
    send(data: string | Buffer) {
        try {
            this.instance.send(data);
        } catch (e) {
            this.sendBuffer.push(data);
        }
    }

    /**
     * Reconnects to a websocket
     */
    reconnect() {
        if (!this.safeClose) {
            setTimeout(() => {
                this.open();
            }, this.autoReconnectInterval);
        }
    }

    /**
     * After successful reconnection send all buffered data to remote
     */
    onOpenResend() {
        for (let data of this.sendBuffer)
            this.send(data);
        this.sendBuffer = [];
    }

    onopen() {
    }

    onmessage(data: { data: Buffer | string }, flags: number, number: number) {
    }

    onerror(e: Error) {
    }

    onclose(e: CloseEvent) {
    }
}
