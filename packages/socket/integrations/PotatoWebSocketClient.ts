import { PotatoSocketUniversal, WebSocketClient, IEncoder, IClientCloseHandler, 
    IClientOpenHandler, IClientOpenCloseHandler } from '../';
import Logger from '@meteor-it/logger';
/**
 * Websocket potato.socket client
 */
export default class PotatoSocketClient extends PotatoSocketUniversal {
    websocketAddress: string;
    websocket: WebSocketClient;

    constructor(name: string | Logger, encoder: IEncoder, websocketAddress: string, reconnectInterval: number = 500) {
        super(name, encoder);
        this.websocketAddress = websocketAddress;
        this.websocket = new WebSocketClient(this.websocketAddress, reconnectInterval);
        this.websocket.onopen = () => {
            this.openHandlers.forEach(handler => handler());
        };
        this.websocket.onclose = status => {
            this.closeHandlers.forEach(handler => handler(status));
        };
        this.websocket.onerror = error => {
            this.logger.error(error.stack || error);
        };
        this.websocket.onmessage = (data) => {
            this.gotBufferFromRemote(Buffer.from(data.data));
        };
    }
    openHandlers: IClientOpenHandler[] = [];
    closeHandlers: IClientCloseHandler[] = [];
    on(event: 'open'|'close'|string, handler: any) {
        if (event === 'open') {
            if (handler.length !== 0)
                throw new Error('"open" listener should receive 0 arguments!');
            this.openHandlers.push(handler);
            return;
        }
        if (event === 'close') {
            if (handler.length !== 1)
                throw new Error('"close" listener should receive 1 argument (status)!');
            this.closeHandlers.push(handler);
            return;
        }
        super.on(event, handler);
    }
    sendBufferToRemote(buffer) {
        this.websocket.send(buffer);
    }
    open() {
        this.websocket.open();
    }
    close() {
        this.websocket.close();
    }
}