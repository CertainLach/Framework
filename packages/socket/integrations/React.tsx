import React,{Component} from 'react';
import PotatoSocketClient from './PotatoWebSocketClient';
import {IEncoder} from "../index";

// To connect react component to PotatoSocket
export function connectSocket(encoder:IEncoder, socketUrl, reconnectInterval, loadingComponent):typeof Component{
    return (Wrapped=>class SocketConnectedComponent extends Component {
        static displayName = `SocketWrapped${Wrapped.name}`;
        socket;
        state;
        constructor(props){
            super(props);
            this.state={
                socketState: 'connection',
                socket: new PotatoSocketClient(Wrapped.name, encoder, socketUrl, reconnectInterval)
            };
        }
        componentDidMount() {
            this.state.socket.open();
        }
        componentWillUnmount(){
            this.state.socket.close();
        }

        render() {
            const wrappedStyle=loadingComponent?{
                visiblity:this.state.socketState==='open'?'visible':'hidden'
            }:{};
            const loadingStyle={
                visiblity:this.state.socketState!=='open'?'visible':'hidden'
            };
            return <Wrapped style={wrappedStyle} {...this.props} socketState={this.state.socketState} socket={this.state.socket}/>
        }
    });
}