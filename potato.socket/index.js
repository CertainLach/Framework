import Logger from '@meteor-it/logger';
import React from 'react';

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

class SocketConnectedComponent extends React.Component {
    static displayName = `SocketWrapped`;
    socket;
    state;
    constructor(props){
        super(props);
        if(this.props.children.length!==1)
            throw new Error('children != 1');
        this.state={
            socketState: 'connection',
            socket: new PotatoSocketClient(props.children[0].name, props.packetDeclaration, props.socketUrl, props.reconnectInterval)
        }
    }
    componentDidMount() {
        this.state.socket.open();
        this.state.socket.on('open', () => this.setState({socketState: 'open'}));
        this.state.socket.on('close', () => this.setState({socketState: 'close'}));
        this.state.socket.on('error', e => {
            throw e
        });
    }

    render() {
        const el=this.props.children[0];
        return <el {...this.props} socketState={this.state.socketState} socket={this.state.socket}/>
        //return React.createElement(this.props.children[0], {...this.props, socketState:this.state.socketState, socket:this.state.socket})
    }
}

// To connect react component to PotatoSocker
export function connectSocket(packetDeclaration, socketUrl, reconnectInterval){
    return Wrapped=>class SocketConnectedComponent extends React.Component {
        static displayName = `SocketWrapped${Wrapped.name}`;
        socket;
        state;
        constructor(props){
            super(props);
            console.log(socketUrl);
            this.state={
                socketState: 'connection',
                socket: new PotatoSocketClient(Wrapped.name, packetDeclaration, socketUrl, reconnectInterval)
            }
        }
        componentDidMount() {
            this.state.socket.open();
            this.state.socket.on('open', () => this.setState({socketState: 'open'}));
            this.state.socket.on('close', () => this.setState({socketState: 'close'}));
            this.state.socket.on('error', e => {
                throw e
            });
        }
        componentWillUnmount(){
            this.state.socket.close();
        }

        render() {
            return <Wrapped {...this.props} socketState={this.state.socketState} socket={this.state.socket}/>
            //return React.createElement(this.props.children[0], {...this.props, socketState:this.state.socketState, socket:this.state.socket})
        }
    }
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
        this.websocket=new WebSocketClient(this.websocketAddress, reconnectInterval);
        this.websocket.onopen=()=>{
            this._emitToListeners('open');
        };
        this.websocket.onclose= status =>{
            this._emitToListeners('close',status);
        };
        this.websocket.onerror = error => {
            this._emitToListeners('error',error);
        };
        this.websocket.onmessage = (data) => {
            let fullDataBuffer = new Buffer(new Uint8Array(data.data));
            let fullData = this.packetDeclaration.deserialize(fullDataBuffer,0)[0];
            this._emitToListeners(fullData.tag,fullData.data);
        };
    }
    activeRPCCalls=[];
    emitRPC(event,data,responseEvent,isCorrectResponseChecker){
        return new Promise((res,rej)=>{
            this.emit(event,data);
            this.activeRPCCalls.push([responseEvent,isCorrectResponseChecker,res]);
        });
    }
    _emitToListeners(event,data){
        if(this.activeRPCCalls.length!==0) {
            let filtered=this.activeRPCCalls.filter(call => call[0] === event).filter(f=>f[1](data));
            if(filtered.length===1){
                filtered[0][2](data);
                return;
            }else if(filtered.length>1){
                this.logger.warn('Got more than 1 RPC answer!');
                filtered.forEach(f=>f[2](data));
            }
            this.activeRPCCalls=this.activeRPCCalls.filter(call=>!filtered.includes(call));
        }

        if(this.eventHandlers[event]){
            this.eventHandlers[event].forEach(l=>l(data));
        }else{
            this.logger.warn('Got packet '+event+', no receivers',data);
        }
    }
    open(){
        this.websocket.open();
    }
    close(){
        this.websocket.close();
    }
    on(event,handler){
        if(!this.eventHandlers[event])
            this.eventHandlers[event]=[];
        this.eventHandlers[event].push(handler);
    }
    emit(event,data){
        let fullData={
            tag: event,
            data
        };
        console.log(fullData);
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
            emit(event,data) {
                let fullData = {
                    tag: event,
                    data
                };
                try {
                    let bufLength = self.packetDeclaration.size_of(fullData);
                    // Unsafe because we know exact length of resulting buffer.
                    let buffer = Buffer.allocUnsafe(bufLength);
                    self.packetDeclaration.serialize(fullData, buffer, 0);
                    socket.send(buffer);
                } catch (e) {
                    self.logger.log(JSON.stringify(fullData));
                    self.logger.error('Packet serialization error!');
                    self.logger.error(e.stack);
                }
            }

        };
        socket.on('message',data=>{
            let fullDataBuffer;
            try {
                fullDataBuffer = new Buffer(new Uint8Array(data));
                let fullData = self.packetDeclaration.deserialize(fullDataBuffer, 0)[0];
                if (wrappedSocket.eventHandlers[fullData.tag])
                    wrappedSocket.eventHandlers[fullData.tag](fullData.data);
            }catch(e){
                this.logger.log(fullDataBuffer);
                this.logger.error('Packet deserialization error!');
                this.logger.error(e.stack);
            }
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