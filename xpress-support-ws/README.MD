# XPress WebSocket support
## Read instruction in XPress to install
## Usage:
```js
server.on('WS /*',async(req, socket, next)=>{
    // Req here - custom object, have all props as on normal http requests
    req.a=123;
    next(); 
});
server.on('WS /a',async(req, socket, next)=>{
    req.a; // = 123
    socket.on('message', msg=>console.log.bind(console));
});
```