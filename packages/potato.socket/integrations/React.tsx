import * as React from 'react';
import PotatoSocketClient from './PotatoWebSocketClient';


class SocketConnectedComponent extends React.Component<any,any> {
    static displayName = `SocketWrapped`;
    socket;
    state;
    unmounted=false;
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
        this.state.socket.on('open', () => {
            if(!this.socket.unmounted)
                this.setState({socketState: 'open'})
        });
        this.state.socket.on('close', status => {
            if(!this.socket.unmounted)
                this.setState({socketState: 'close'})
        });
    }
    componentWillUnmount(){
        this.unmounted = true;
        this.state.socket.close();
    }
    render() {
        const el=this.props.children[0];
        return <el {...this.props} socketState={this.state.socketState} socket={this.state.socket}/>
        //return React.createElement(this.props.children[0], {...this.props, socketState:this.state.socketState, socket:this.state.socket})
    }
}

// To connect react component to PotatoSocker
export function connectSocket(packetDeclaration, socketUrl, reconnectInterval, loadingComponent){
    return Wrapped=>class SocketConnectedComponent extends React.Component {
        static displayName = `SocketWrapped${Wrapped.name}`;
        socket;
        state;
        constructor(props){
            super(props);
            this.state={
                socketState: 'connection',
                socket: new PotatoSocketClient(Wrapped.name, packetDeclaration, socketUrl, reconnectInterval)
            };
            this.state.socket.on('open', () => this.setState({socketState: 'open'}));
            this.state.socket.on('close', code => this.setState({socketState: 'close'}));
        }
        componentDidMount() {
            setTimeout(()=>{
                this.state.socket.open();
            },1000);
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
            return <div>
                {loadingComponent?<loadingComponent style={loadingStyle}/>:''}
                <Wrapped style={wrappedStyle} {...this.props} socketState={this.state.socketState} socket={this.state.socket}/>

            </div>
            //<loadingComponent/>;
            //return React.createElement(this.props.children[0], {...this.props, socketState:this.state.socketState, socket:this.state.socket})
        }
    }
}