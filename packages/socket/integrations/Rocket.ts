import {RocketComponent,r,observable} from '@meteor-it/rocket';
import PotatoSocketClient from './PotatoWebSocketClient';
import {IEncoder} from "../index";

// TODO: Names
export function connectToSocket<P>(encoder,socketUrl,reconnectInterval):(Wrap:RocketComponent<P>)=>any{
    return Wrap=>(class SocketWrapper extends RocketComponent<P> {
        static displayName = `SocketWrapper`;
        @observable socket;
        @observable socketState;
        constructor(){
            super()
            this.socket=new PotatoSocketClient(Wrap.name||'potato', encoder, socketUrl, reconnectInterval);
            this.socketState='connection';
            // this.state={
            //     socketState: 'connection',
            //     socket: new PotatoSocketClient(Wrap.name||'potato', encoder, socketUrl, reconnectInterval)
            // };
        }
        onMountEnd() {
            this.socket.open();
        }
        onUnmountStart(){
            this.socket.close();
        }
    
        render() {
            return r(Wrap,{
                ...this.props,
                socketState:this.socketState,
                socket:this.socket
            },this.props.children);
        }
    })
}