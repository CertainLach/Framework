import { PotatoSocketUniversal, WebSocketClient, IEncoder, IClientCloseHandler, IClientOpenHandler } from '../';
import Logger from '@meteor-it/logger';
/**
 * Websocket potato.socket client
 */
export default class PotatoSocketClient extends PotatoSocketUniversal {
    websocketAddress: string;
    websocket: WebSocketClient;
    constructor(name: string | Logger, encoder: IEncoder, websocketAddress: string, reconnectInterval?: number);
    openHandlers: IClientOpenHandler[];
    closeHandlers: IClientCloseHandler[];
    on(event: 'open' | 'close' | string, handler: any): void;
    sendBufferToRemote(buffer: any): void;
    open(): void;
    close(): void;
}
