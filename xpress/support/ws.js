import {
    Server
}
from 'uws';

export default function addSupport(nativeServer, routeHandler, xpress) {
    // Patch xpress to return Websocket support!
    const ws = new Server({
        server: nativeServer
    });
    ws.on('connection', (socket) => {
        // Websocket request handler, acts similar to httpHandler()
        // TODO: Provide own req object, instead of upgradeReq
        xpress.populateReqRes(socket.upgradeReq);
        socket.__RAW = true;
        socket.upgradeReq.method = 'WS'; // Because upgrade req is a get
        // Socket will be transfered over handlers chain as http response
        routeHandler(socket.upgradeReq, socket, err => {
            // No handlers? Close socket. 404 as in http
            if (process.env.ENV === 'development')
                socket.close(404, err ? err.stack : new Error('next() called, but no next handlers are found').stack);
            else
                socket.close();
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