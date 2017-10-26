import {
    WebSocketClient, PotatoSocketUniversal, 
    IEncoder, PacketType, IServerOpenHandler, 
    IServerCloseHandler, IServerOpenCloseHandler
}from '../';
import Logger from '@meteor-it/logger';

/**
 * For internal use
 */
export class PotatoWebSocketServerInternalClient extends PotatoSocketUniversal {
    websocket: WebSocketClient;
    session: any = {};
    id: string;

    constructor(id: string, server: PotatoWebSocketServer, websocket) {
        super(server.logger,server.encoder, server);
        this.id = id;
        this.websocket = websocket;
        this.logger = server.logger;
        websocket.on('message', data => {
            this.gotBufferFromRemote(Buffer.from(data));
        });
    }
    sendBufferToRemote(buffer) {
        this.websocket.send(buffer);
    }
}

/**
 * Websocket potato.socket server
 */
export default class PotatoWebSocketServer extends PotatoSocketUniversal {
    clients: {[key:string]:PotatoWebSocketServerInternalClient} = {};
    constructor(name:string|Logger, encoder: IEncoder) {
        super(name, encoder);
        this.isServer=true;
    }

    /**
     * Emit data to every connected socket
     * @param event
     * @param data
     */
    emit(event: string, data: any):boolean {
        if(!this.encoder.hasEvent(event))
            throw new Error('Trying to emit not existing packet!');
        try {
            let serialized = this.encoder.encodeData({
                type: PacketType.EVENT,
                name: event,
                data: data
            });
            for(let clientId in this.clients){
                let client=this.clients[clientId];
                client.sendBufferToRemote(serialized);
            }
        } catch (e) {
            this.logger.error(JSON.stringify(data));
            this.logger.error(`Server failed to serialize data for ${event}`);
            this.logger.error(e.stack);
        }
        return true;
    }
    openHandlers: IServerOpenHandler[] = [];
    closeHandlers: IServerCloseHandler[] = [];

    on(event: string, listener: any) {
        if (event === 'open') {
            if (listener.length !== 1)
                throw new Error('"open" listener should receive 1 argument (socket)!');
            this.openHandlers.push(listener);
            return;
        }
        if (event === 'close') {
            if (listener.length !== 1)
                throw new Error('"close" listener should receive 1 argument (socket)!');
            this.closeHandlers.push(listener);
            return;
        }
        super.on(event, listener);
    }
    handler(req, websocket) {
        let id = Math.random().toString(32).substr(2);
        let wrappedSocket = new PotatoWebSocketServerInternalClient(id, this, websocket);
        wrappedSocket.id = id;
        if (req.session)
            wrappedSocket.session = req.session;
        this.clients[id] = wrappedSocket;
        websocket.on('close', status => {
            delete this.clients[id];
            this.closeHandlers.forEach(handler => {
                handler(wrappedSocket, status);
            });
        });
        this.openHandlers.forEach(handler => {
            handler(wrappedSocket);
        });
    }
}