import Logger from '@meteor-it/logger';
import {Component} from 'react';

// Autoreconnection socket
class WebSocketClient {
    number = 0; // Message id
    autoReconnectInterval;
    url;
    instance;
    safeClose = false;
    constructor(url, reconnectInterval=100) {
        this.autoReconnectInterval = reconnectInterval; // ms
        this.url=url;
    }

    open() {
        this.safeClose=false;
        this.instance = new WebSocket(this.url);
        this.instance.binaryType = 'arraybuffer';
        this.instance.onopen = () => {
            console.log("WebSocketClient: open!");
            this.onopen();
        };
        this.instance.onmessage = (data, flags) => {
            this.number++;
            this.onmessage(data, flags, this.number);
        };
        this.instance.onclose = (e) => {
            if (!this.safeClose){
                switch (e) {
                    case 1000:	// CLOSE_NORMAL
                        this.onclose(e);
                        break;
                    default:	// Abnormal closure
                        this.reconnect();
                        break;
                }
            }else{
                this.onclose(e);
            }
        };
        this.instance.onerror = (e) => {
            switch (e.code) {
                case 'ECONNREFUSED':
                    if (!this.safeClose)
                        this.reconnect();
                    else
                        this.onclose(e);
                    break;
                default:
                    this.onerror(e);
                    break;
            }
        };
    }

    close() {
        this.safeClose = true;
        this.instance.close();
    }

    send(data, option) {
        try {
            this.instance.send(data, option);
        } catch (e) {
            this.instance.onerror(e);
        }
    }

    reconnect() {
        if (!this.safeClose) {
            console.log(`WebSocket: retry in ${this.autoReconnectInterval}ms`);
            setTimeout(() => {
                console.log("WebSocket: reconnection...");
                this.open();
            }, this.autoReconnectInterval);
        }
    }

    onopen() {
    }

    onmessage(data, flags, number) {
    }

    onerror(e) {
    }

    onclose(e) {
    }
}

// To connect react component to PotatoSocker
export function connectSocket(packetDeclaration, socketUrl, reconnectInterval){
    return (WrappedComponent)=>class SocketConnectedComponent extends Component {
        socket;
        state={
            socketState: 'connection',
            socket: new PotatoSocketClient(WrappedComponent.name,packetDeclaration, socketUrl, reconnectInterval)
        };
        componentDidMount() {
            this.state.socket.on('open',()=>this.setState({socketState:'open'}));
            this.state.socket.on('close',()=>this.setState({socketState:'close'}));
            this.state.socket.on('error',e=>{throw e});
        }
        render(){
            return (<WrappedComponent {...this.props} socketState={this.state.socketState} socket={this.state.socket}>

            <WrappedComponent/>);
        }
    };
}

export class PotatoSocketClient {
    logger;
    packetDeclaration;
    eventHandlers={};
    websocketAddress;
    websocket;
    constructor(name, packetDeclaration, websocketAddress, reconnectInterval){
        this.logger=new Logger(name);
        this.packetDeclaration=packetDeclaration;
        this.websocketAddress=websocketAddress;
        this.websocket=new WebSocketClient(name, reconnectInterval);
        this.websocket.onopen=()=>{
            if(this.eventHandlers.open)
                this.eventHandlers.open();
        };
        this.websocket.onclose= status =>{
            if(this.eventHandlers.close)
                this.eventHandlers.close(status);
        };
        this.websocket.onerror = error => {
            if(this.eventHandlers.error)
                this.eventHandlers.error(error);
        };
        this.websocket.onmessage = (data) => {
            let fullDataBuffer = new Buffer(new Uint8Array(data.data));
            let fullData = this.packetDeclaration.deserialize(fullDataBuffer,0)[0];
            if(this.eventHandlers[fullData.tag]){
                this.eventHandlers[fullData.tag](fullData.data);
            }
        };
    }
    open(){
        this.websocket.open();
    }
    close(){
        this.websocket.close();
    }
    on(event,handler){
        this.eventHandlers[event]=handler;
    }
    emit(event,data){
        let fullData={
            tag: event,
            data
        };
        let bufLength=this.packetDeclaration.size_of(fullData);
        // Unsafe because we know exact length of resulting buffer.
        let buffer = Buffer.allocUnsafe(bufLength);
        this.packetDeclaration.serialize(fullData,buffer,0);
        this.websocket.send(buffer);
    }
}
export class PotatoSocketServer {
    logger;
    packetDeclaration;
    sockets={};
    eventHandlers={};
    constructor(name, packetDeclaration){
        this.logger=new Logger(name);
        this.packetDeclaration=packetDeclaration;
    }
    on(event,handler){
        this.eventHandlers[event]=handler;
    }
    emit(event,data){
        for(let socket of Object.values(this.sockets))
            socket.emit(event,data);
    }
    handler(req,socket){
        let self=this;
        const wrappedSocket={
            id: Math.random().toString(36).substr(2),
            eventHandlers:[],
            on(event,handler){
                if(wrappedSocket.eventHandlers[event])
                    self.logger.warn(`Socket already has ${event} handler attached!`);
                wrappedSocket.eventHandlers[event]=handler;
            },
            emit(event,data){
                let fullData={
                    tag: event,
                    data
                };
                let bufLength=self.packetDeclaration.size_of(fullData);
                // Unsafe because we know exact length of resulting buffer.
                let buffer = Buffer.allocUnsafe(bufLength);
                self.packetDeclaration.serialize(fullData,buffer,0);
                socket.send(buffer);
            }
        };
        socket.on('message',data=>{
            let fullDataBuffer = new Buffer(new Uint8Array(data));
            let fullData = self.packetDeclaration.deserialize(fullDataBuffer,0)[0];
            if(wrappedSocket.eventHandlers[fullData.tag])
                wrappedSocket.eventHandlers[fullData.tag](fullData.data);
        });
        socket.on('close',()=>{
            if(wrappedSocket.eventHandlers['close'])
                wrappedSocket.eventHandlers['close']();
        });
        if(this.eventHandlers['connection'])
            this.eventHandlers['connection'](wrappedSocket);
        this.sockets[wrappedSocket.id]=wrappedSocket;
    }
}