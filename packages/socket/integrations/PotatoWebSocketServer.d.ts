/// <reference types="node" />
import { PotatoSocketUniversal, IEncoder, IServerOpenHandler, IServerCloseHandler, IRPCFieldWithThis, IRPCFieldWithoutThis } from '../';
import Logger from '@meteor-it/logger';
import WebSocketClient from '../WebSocketClient';
/**
 * For internal use
 */
export declare class PotatoWebSocketServerInternalClient extends PotatoSocketUniversal<IRPCFieldWithoutThis> {
    websocket: WebSocketClient;
    session: any;
    id: string;
    constructor(id: string, server: PotatoWebSocketServer, websocket: WebSocketClient);
    sendBufferToRemote(buffer: Buffer): void;
}
/**
 * Websocket potato.socket server
 */
export default class PotatoWebSocketServer extends PotatoSocketUniversal<Readonly<IRPCFieldWithThis<PotatoWebSocketServer>>> {
    clients: {
        [key: string]: PotatoWebSocketServerInternalClient;
    };
    constructor(name: string | Logger, encoder: IEncoder);
    /**
     * Emit data to every connected socket
     * @param event
     * @param data
     */
    emit(event: string, data: any): boolean;
    openHandlers: IServerOpenHandler<PotatoWebSocketServerInternalClient>[];
    closeHandlers: IServerCloseHandler<PotatoWebSocketServerInternalClient>[];
    rpc(): IRPCFieldWithThis<this>;
    on(event: string, listener: any): void;
    handler(req: Request, websocket: WebSocketClient): void;
}
