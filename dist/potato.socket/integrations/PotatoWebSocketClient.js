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
})(["require", "exports", "../"], function (require, exports) {
    "use strict";
    var _1 = require("../");
    /**
     * Websocket potato.socket client
     */
    var PotatoSocketClient = (function (_super) {
        __extends(PotatoSocketClient, _super);
        function PotatoSocketClient(name, encoder, websocketAddress, reconnectInterval) {
            if (reconnectInterval === void 0) { reconnectInterval = 500; }
            var _this = _super.call(this, name, encoder) || this;
            _this.openHandlers = [];
            _this.closeHandlers = [];
            _this.websocketAddress = websocketAddress;
            _this.websocket = new _1.WebSocketClient(_this.websocketAddress, reconnectInterval);
            _this.websocket.onopen = function () {
                _this.openHandlers.forEach(function (handler) { return handler(); });
            };
            _this.websocket.onclose = function (status) {
                _this.closeHandlers.forEach(function (handler) { return handler(status); });
            };
            _this.websocket.onerror = function (error) {
                _this.logger.error(error.stack || error);
            };
            _this.websocket.onmessage = function (data) {
                _this.gotBufferFromRemote(Buffer.from(data.data));
            };
            return _this;
        }
        PotatoSocketClient.prototype.on = function (event, handler) {
            if (event === 'open') {
                if (handler.length !== 0)
                    throw new Error('"open" listener should receive 0 arguments!');
                this.openHandlers.push(handler);
                return;
            }
            if (event === 'close') {
                if (handler.length !== 1)
                    throw new Error('"close" listener should receive 1 argument (status)!');
                this.closeHandlers.push(handler);
                return;
            }
            _super.prototype.on.call(this, event, handler);
        };
        PotatoSocketClient.prototype.sendBufferToRemote = function (buffer) {
            this.websocket.send(buffer);
        };
        PotatoSocketClient.prototype.open = function () {
            this.websocket.open();
        };
        PotatoSocketClient.prototype.close = function () {
            this.websocket.close();
        };
        return PotatoSocketClient;
    }(_1.PotatoSocketUniversal));
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = PotatoSocketClient;
});
//# sourceMappingURL=PotatoWebSocketClient.js.map