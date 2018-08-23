/// <reference types="node" />
import { PotatoSocketUniversal, IEncoder, IClientCloseHandler, IClientOpenHandler, IRPCFieldWithoutThis } from '../';
import Logger from '@meteor-it/logger';
import WebSocketClient from '../WebSocketClient';
/**
 * Websocket potato.socket client
 */
export default class PotatoSocketClient extends PotatoSocketUniversal<IRPCFieldWithoutThis> {
    websocketAddress: string;
    websocket: WebSocketClient;
    constructor(name: string | Logger, encoder: IEncoder, websocketAddress: string, reconnectInterval?: number);
    openHandlers: IClientOpenHandler[];
    closeHandlers: IClientCloseHandler[];
    on(event: 'open' | 'close' | string, handler: any): void;
    sendBufferToRemote(buffer: Buffer): void;
    open(): void;
    close(): void;
}
