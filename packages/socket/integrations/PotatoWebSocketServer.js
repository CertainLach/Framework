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
import { PotatoSocketUniversal, PacketType } from '../';
/**
 * For internal use
 */
var PotatoWebSocketServerInternalClient = /** @class */ (function (_super) {
    __extends(PotatoWebSocketServerInternalClient, _super);
    function PotatoWebSocketServerInternalClient(id, server, websocket) {
        var _this = _super.call(this, server.logger, server.encoder, server) || this;
        _this.session = {};
        _this.id = id;
        _this.websocket = websocket;
        _this.logger = server.logger;
        websocket.on('message', function (data) {
            _this.gotBufferFromRemote(Buffer.from(data));
        });
        return _this;
    }
    PotatoWebSocketServerInternalClient.prototype.sendBufferToRemote = function (buffer) {
        this.websocket.send(buffer);
    };
    return PotatoWebSocketServerInternalClient;
}(PotatoSocketUniversal));
export { PotatoWebSocketServerInternalClient };
/**
 * Websocket potato.socket server
 */
var PotatoWebSocketServer = /** @class */ (function (_super) {
    __extends(PotatoWebSocketServer, _super);
    function PotatoWebSocketServer(name, encoder) {
        var _this = _super.call(this, name, encoder) || this;
        _this.clients = {};
        _this.openHandlers = [];
        _this.closeHandlers = [];
        _this.isServer = true;
        return _this;
    }
    /**
     * Emit data to every connected socket
     * @param event
     * @param data
     */
    PotatoWebSocketServer.prototype.emit = function (event, data) {
        if (!this.encoder.hasEvent(event))
            throw new Error('Trying to emit not existing packet!');
        try {
            var serialized = this.encoder.encodeData({
                type: PacketType.EVENT,
                name: event,
                data: data
            });
            for (var clientId in this.clients) {
                var client = this.clients[clientId];
                client.sendBufferToRemote(serialized);
            }
        }
        catch (e) {
            this.logger.error(JSON.stringify(data));
            this.logger.error("Server failed to serialize data for " + event);
            this.logger.error(e.stack);
        }
        return true;
    };
    PotatoWebSocketServer.prototype.on = function (event, listener) {
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
        _super.prototype.on.call(this, event, listener);
    };
    PotatoWebSocketServer.prototype.handler = function (req, websocket) {
        var _this = this;
        var id = Math.random().toString(32).substr(2);
        var wrappedSocket = new PotatoWebSocketServerInternalClient(id, this, websocket);
        wrappedSocket.id = id;
        if (req.session)
            wrappedSocket.session = req.session;
        this.clients[id] = wrappedSocket;
        websocket.on('close', function (status) {
            delete _this.clients[id];
            _this.closeHandlers.forEach(function (handler) {
                handler(wrappedSocket, status);
            });
        });
        this.openHandlers.forEach(function (handler) {
            handler(wrappedSocket);
        });
    };
    return PotatoWebSocketServer;
}(PotatoSocketUniversal));
export default PotatoWebSocketServer;
//# sourceMappingURL=PotatoWebSocketServer.js.map