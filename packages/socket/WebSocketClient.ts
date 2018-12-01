

/**
 * Websocket wrapper with auto-reconnection
 */
export default class WebSocketClient {
    number:number = 0; // Message id
    autoReconnectInterval:number;
    url:string;
    instance:WebSocket;
    safeClose = false;

    constructor(url:string, reconnectInterval:number = 100) {
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
        (<any>this.instance).onmessage = (data:any, flags:number) => {
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
            switch ((<any>e).code) {
                case 'ECONNREFUSED':
                    if (!this.safeClose)
                        this.reconnect();
                    else
                        this.onclose(<any>e);
                    break;
                default:
                    this.onerror(<any>e);
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

    sendBuffer:(string|Buffer)[] = [];

    /**
     * Sends data to remote socket or saves to buffer if not available
     * @param data
     */
    send(data:string|Buffer) {
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

    onmessage(data:{data:Buffer|string}, flags:number, number:number) {
    }

    onerror(e:Error) {
    }

    onclose(e:CloseEvent) {
    }
}