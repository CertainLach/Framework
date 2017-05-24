# XPress Potato Socket support
## What is Potato Socket?
This is a Websocket wrapper with packet (de)serialization tougth ProtoDef
Also supports RPC
## Read instruction in XPress to install
## Usage:
```js
server.on('POTATO /*',async(req, socket, next)=>{
    // Req here - custom object, have all props as on normal http requests
    // All types from protodef
    socket.addPacket('packetName',{
      field1:'string',
      field2:'i8',
      ...
    });
    next(); 
});
server.on('POTATO /a',async(req, socket, next)=>{
    req.a; // = 123
    socket.on('packetName', msg=>console.log.bind(console));
    // RPC
    await socket.remoteFunc(params)
});
```