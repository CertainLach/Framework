"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
const react_1 = require("react");
const PotatoWebSocketClient_1 = require("./PotatoWebSocketClient");
function connectSocket(encoder, socketUrl, reconnectInterval, loadingComponent) {
    return (Wrapped => { return _a = class SocketConnectedComponent extends react_1.Component {
            constructor(props) {
                super(props);
                this.state = {
                    socketState: 'connection',
                    socket: new PotatoWebSocketClient_1.default(Wrapped.name, encoder, socketUrl, reconnectInterval)
                };
            }
            componentDidMount() {
                this.state.socket.open();
            }
            componentWillUnmount() {
                this.state.socket.close();
            }
            render() {
                const wrappedStyle = loadingComponent ? {
                    visiblity: this.state.socketState === 'open' ? 'visible' : 'hidden'
                } : {};
                const loadingStyle = {
                    visiblity: this.state.socketState !== 'open' ? 'visible' : 'hidden'
                };
                return react_1.default.createElement(Wrapped, __assign({ style: wrappedStyle }, this.props, { socketState: this.state.socketState, socket: this.state.socket }));
            }
        },
        _a.displayName = `SocketWrapped${Wrapped.name}`,
        _a; var _a; });
}
exports.connectSocket = connectSocket;
//# sourceMappingURL=React.js.map