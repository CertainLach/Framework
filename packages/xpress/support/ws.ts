import {
    Server
}
from 'uws';

export default function addSupport(nativeServer, xpress) {
    // Patch xpress to return Websocket support!
    const ws = new Server({
        server: nativeServer
    });
    ws.on('connection', (socket) => {
        // Websocket request handler, acts similar to httpHandler()
        // TODO: Provide own req object, instead of upgradeReq
        xpress.populateRequest(socket.upgradeReq);
        socket.__RAW = true;
        socket.upgradeReq.method = 'WS'; // Because upgrade req is a get
        let url=socket.upgradeReq.url;
        let session=socket.upgradeReq.session;
        // Socket will be transfered over handlers chain as http response
        console.log(session);
        xpress.handle({
            url,
            session,
            headers:socket.upgradeReq.headers,
            method:'WS'
        },socket,err=> {
            // No handlers? Close socket. 404 as in http
            socket.close(1001);
            if(!err)
                xpress.logger.warn('404 Socket url not found at ' + url);
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
    xpress.logger.debug('Added WS support!');
}