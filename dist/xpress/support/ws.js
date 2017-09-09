(function (dependencies, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    }
})(["require", "exports", "uws"], function (require, exports) {
    "use strict";
    var uws_1 = require("uws");
    function addSupport(nativeServer, xpress) {
        // Patch xpress to return Websocket support!
        var ws = new uws_1.Server({
            server: nativeServer
        });
        ws.on('connection', function (socket) {
            // Websocket request handler, acts similar to httpHandler()
            // TODO: Provide own req object, instead of upgradeReq
            xpress.populateRequest(socket.upgradeReq);
            socket.__RAW = true;
            socket.upgradeReq.method = 'WS'; // Because upgrade req is a get
            // Socket will be transfered over handlers chain as http response
            xpress.handle({
                url: socket.upgradeReq.url,
                session: socket.upgradeReq.session || { save: function () { } },
                headers: socket.upgradeReq.headers,
                method: 'WS'
            }, socket, function (err) {
                // No handlers? Close socket. 404 as in http
                socket.close(1001);
                if (!err)
                    xpress.logger.warn('404 Socket url not found at ' + socket.upgradeReq.url);
                // Handle any error here
                if (err instanceof Error)
                    // We can throw there, but then error will be filled with http internals
                    // So, just log
                    xpress.logger.error(err);
                else if (err !== undefined)
                    // String/something other thrown? I dont like that...
                    // But anyway, lets log them
                    xpress.logger.error(new Error(err));
            }, socket.upgradeReq.originalUrl);
        });
        xpress.logger.log('Added WS support!');
    }
    exports.addSupport = addSupport;
});
//# sourceMappingURL=ws.js.map