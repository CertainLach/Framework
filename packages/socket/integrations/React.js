var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
import React, { Component } from 'react';
import PotatoSocketClient from './PotatoWebSocketClient';
// To connect react component to PotatoSocket
export function connectSocket(encoder, socketUrl, reconnectInterval, loadingComponent) {
    return (function (Wrapped) { return _a = /** @class */ (function (_super) {
            __extends(SocketConnectedComponent, _super);
            function SocketConnectedComponent(props) {
                var _this = _super.call(this, props) || this;
                _this.state = {
                    socketState: 'connection',
                    socket: new PotatoSocketClient(Wrapped.name, encoder, socketUrl, reconnectInterval)
                };
                return _this;
            }
            SocketConnectedComponent.prototype.componentDidMount = function () {
                this.state.socket.open();
            };
            SocketConnectedComponent.prototype.componentWillUnmount = function () {
                this.state.socket.close();
            };
            SocketConnectedComponent.prototype.render = function () {
                var wrappedStyle = loadingComponent ? {
                    visiblity: this.state.socketState === 'open' ? 'visible' : 'hidden'
                } : {};
                var loadingStyle = {
                    visiblity: this.state.socketState !== 'open' ? 'visible' : 'hidden'
                };
                return React.createElement(Wrapped, __assign({ style: wrappedStyle }, this.props, { socketState: this.state.socketState, socket: this.state.socket }));
            };
            return SocketConnectedComponent;
        }(Component)),
        _a.displayName = "SocketWrapped" + Wrapped.name,
        _a; var _a; });
}
//# sourceMappingURL=React.js.map