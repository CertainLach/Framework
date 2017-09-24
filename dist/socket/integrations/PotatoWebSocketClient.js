"use strict";
const _1 = require("../");
class PotatoSocketClient extends _1.PotatoSocketUniversal {
    constructor(name, encoder, websocketAddress, reconnectInterval = 500) {
        super(name, encoder);
        this.openHandlers = [];
        this.closeHandlers = [];
        this.websocketAddress = websocketAddress;
        this.websocket = new _1.WebSocketClient(this.websocketAddress, reconnectInterval);
        this.websocket.onopen = () => {
            this.openHandlers.forEach(handler => handler());
        };
        this.websocket.onclose = status => {
            this.closeHandlers.forEach(handler => handler(status));
        };
        this.websocket.onerror = error => {
            this.logger.error(error.stack || error);
        };
        this.websocket.onmessage = (data) => {
            this.gotBufferFromRemote(Buffer.from(data.data));
        };
    }
    on(event, handler) {
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
        super.on(event, handler);
    }
    sendBufferToRemote(buffer) {
        this.websocket.send(buffer);
    }
    open() {
        this.websocket.open();
    }
    close() {
        this.websocket.close();
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = PotatoSocketClient;
//# sourceMappingURL=PotatoWebSocketClient.js.map