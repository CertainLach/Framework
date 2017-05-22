import {Server} from 'uws';

export function addSupport(server) {
    server.addPossible('WS');
    // Patch xpress to return Websocket support!
    server.wsHandler=(socket)=>{
        // Websocket request handler, acts similar to httpHandler()
        // TODO: Provide own req object, instead of upgradeReq
        this.parseReqUrl(socket.upgradeReq);
        socket.upgradeReq.method='WS'; // Because upgrade req is a get
        // Socket will be transfered over handlers chain as http response 
        this.handle(socket.upgradeReq,socket,err=>{
            // No handlers? Close socket. 404 as in http
            if(process.env.ENV==='development')
                socket.close(404,err?err.stack:new Error('next() called, but no next handlers are found').stack);
            else
                socket.close();
            this.logger.warn('404 Socket url not found at '+socket.upgradeReq.url);
            // Handle any error here
            if(err instanceof Error)
                // We can throw there, but then error will be filled with http internals
                // So, just log
                this.logger.error(err);
            else if(err!==undefined)
                // String/something other thrown? I dont like that...
                // But anyway, lets log them
                this.logger.error(new Error(err));
        }, socket.upgradeReq.originalUrl);
    };
    server.onListen((httpServer,xpressServer)=>{
        const ws = new Server({server: httpServer});
        ws.on('connection', server.wsHandler.bind(server));         
        xpressServer.logger.log('Added WS support!');
    });
}