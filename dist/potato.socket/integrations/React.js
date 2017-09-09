var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
(function (dependencies, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    }
})(["require", "exports", "react", "./PotatoWebSocketClient"], function (require, exports) {
    "use strict";
    var React = require("react");
    var PotatoWebSocketClient_1 = require("./PotatoWebSocketClient");
    var SocketConnectedComponent = (function (_super) {
        __extends(SocketConnectedComponent, _super);
        function SocketConnectedComponent(props) {
            var _this = _super.call(this, props) || this;
            _this.unmounted = false;
            if (_this.props.children.length !== 1)
                throw new Error('children != 1');
            _this.state = {
                socketState: 'connection',
                socket: new PotatoWebSocketClient_1.default(props.children[0].name, props.packetDeclaration, props.socketUrl, props.reconnectInterval)
            };
            return _this;
        }
        SocketConnectedComponent.prototype.componentDidMount = function () {
            var _this = this;
            this.state.socket.open();
            this.state.socket.on('open', function () {
                if (!_this.socket.unmounted)
                    _this.setState({ socketState: 'open' });
            });
            this.state.socket.on('close', function (status) {
                if (!_this.socket.unmounted)
                    _this.setState({ socketState: 'close' });
            });
        };
        SocketConnectedComponent.prototype.componentWillUnmount = function () {
            this.unmounted = true;
            this.state.socket.close();
        };
        SocketConnectedComponent.prototype.render = function () {
            var el = this.props.children[0];
            return <el {...this.props} socketState={this.state.socketState} socket={this.state.socket}/>;
            //return React.createElement(this.props.children[0], {...this.props, socketState:this.state.socketState, socket:this.state.socket})
        };
        return SocketConnectedComponent;
    }(React.Component));
    SocketConnectedComponent.displayName = "SocketWrapped";
    // To connect react component to PotatoSocker
    function connectSocket(packetDeclaration, socketUrl, reconnectInterval, loadingComponent) {
        return function (Wrapped) { return _a = (function (_super) {
                __extends(SocketConnectedComponent, _super);
                function SocketConnectedComponent(props) {
                    var _this = _super.call(this, props) || this;
                    _this.state = {
                        socketState: 'connection',
                        socket: new PotatoWebSocketClient_1.default(Wrapped.name, packetDeclaration, socketUrl, reconnectInterval)
                    };
                    _this.state.socket.on('open', function () { return _this.setState({ socketState: 'open' }); });
                    _this.state.socket.on('close', function (code) { return _this.setState({ socketState: 'close' }); });
                    return _this;
                }
                SocketConnectedComponent.prototype.componentDidMount = function () {
                    var _this = this;
                    setTimeout(function () {
                        _this.state.socket.open();
                    }, 1000);
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
                    return <div>
                {loadingComponent ? <loadingComponent style={loadingStyle}/> : ''}
                <Wrapped style={wrappedStyle} {...this.props} socketState={this.state.socketState} socket={this.state.socket}/>

            </div>;
                    //<loadingComponent/>;
                    //return React.createElement(this.props.children[0], {...this.props, socketState:this.state.socketState, socket:this.state.socket})
                };
                return SocketConnectedComponent;
            }(React.Component)),
            _a.displayName = "SocketWrapped" + Wrapped.name,
            _a; var _a; };
    }
    exports.connectSocket = connectSocket;
});
//# sourceMappingURL=React.js.map