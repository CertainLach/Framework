import {Server} from 'uws';
import {createPotatoSocket} from 'potato.socket';

export function addSupport(server) {
    server.addPossible('POTATO');
    // Patch xpress to return Websocket support!
    server.potatoWsHandler = async (webSocket) => {
        // Websocket request handler, acts similar to httpHandler()
        // TODO: Provide own req object, instead of upgradeReq
        let req=webSocket.upgradeReq;
        server.parseReqUrl(req);
        req.method = 'POTATO'; // Because upgrade req is a get
        // Socket will be transfered over handlers chain as http response 

        server.handle(req, await createPotatoSocket(webSocket), err => {
            // No handlers? Close socket. 404 as in http
            if (process.env.ENV === 'development')
                webSocket.close(404, err ? err.stack : new Error('next() called, but no next handlers are found').stack);
            else
                webSocket.close();
            server.logger.warn('404 Socket url not found at ' + req.url);
            // Handle any error here
            if (err instanceof Error)
            // We can throw there, but then error will be filled with http internals
            // So, just log
                server.logger.error(err);
            else if (err !== undefined)
            // String/something other thrown? I dont like that...
            // But anyway, lets log them
            server.logger.error(new Error(err));
        }, req.url);
    };
    server.onListen((httpServer, xpressServer) => {
        const potato = new Server({
            server: httpServer
        });
        potato.on('connection', server.potatoWsHandler);
        xpressServer.logger.log('Added POTATO support!');
    });
}