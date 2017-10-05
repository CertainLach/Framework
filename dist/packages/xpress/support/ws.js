"use strict";
const uws_1 = require("uws");
function addSupport(nativeServer, xpress) {
    const ws = new uws_1.Server({
        server: nativeServer
    });
    ws.on('connection', (socket) => {
        xpress.populateRequest(socket.upgradeReq);
        socket.__RAW = true;
        socket.upgradeReq.method = 'WS';
        xpress.handle({
            url: socket.upgradeReq.url,
            session: socket.upgradeReq.session || { save() { } },
            headers: socket.upgradeReq.headers,
            method: 'WS'
        }, socket, err => {
            socket.close(1001);
            if (!err)
                xpress.logger.warn('404 Socket url not found at ' + socket.upgradeReq.url);
            if (err instanceof Error)
                xpress.logger.error(err);
            else if (err !== undefined)
                xpress.logger.error(new Error(err));
        }, socket.upgradeReq.originalUrl);
    });
    xpress.logger.log('Added WS support!');
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = addSupport;
//# sourceMappingURL=ws.js.map