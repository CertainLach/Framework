import { PotatoSocketUniversal, IEncoder, IClientCloseHandler, 
    IClientOpenHandler, IClientOpenCloseHandler,IRPCFieldWithoutThis } from '../';
import Logger from '@meteor-it/logger';
import WebSocketClient from '../WebSocketClient';

/**
 * Websocket potato.socket client
 */
export default class PotatoSocketClient extends PotatoSocketUniversal<IRPCFieldWithoutThis> {
    websocketAddress: string;
    websocket: WebSocketClient;

    constructor(name: string | Logger, encoder: IEncoder, websocketAddress: string, reconnectInterval: number = 500) {
        super(name, encoder);
        this.websocketAddress = websocketAddress;
        this.websocket = new WebSocketClient(this.websocketAddress, reconnectInterval);
        this.websocket.onopen = () => {
            this.openHandlers.forEach(handler => handler());
        };
        this.websocket.onclose = (e:CloseEvent)=> {
            this.closeHandlers.forEach(handler => handler(e.code));
        };
        this.websocket.onerror = (error:Error) => {
            this.logger.error(error.stack || error);
        };
        this.websocket.onmessage = (data:{data:Buffer}) => {
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
    sendBufferToRemote(buffer:Buffer) {
        this.websocket.send(buffer);
    }
    open() {
        this.websocket.open();
    }
    close() {
        this.websocket.close();
    }
}