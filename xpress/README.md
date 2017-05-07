# XPress
## Usage example:
```js
import XPress,{Router} from '@meteor-it/xpress';

const server = new XPress('name');

server.on('GET /',async (req,res)=>{
    res.redirect('/test/route');
});
server.on('GET /*',async (req,res,next)=>{
    req.a=1;
    next();
});
server.on('GET /**',async (req,res,next)=>{
    req.b=2;
    next();
});
server.on('ALL /t:c/*/*',async (req,res,next)=>{
    // If url === /test/route/testing?a=12&a=33&c=42
    
    // Custom defined strings
    req.a; // = undefined
    req.b; // = 2
    
    // Extracted from path
    req.params.c; // = est
    req.params.star; // = route
    req.params.star_2; // = testing
    
    // Querystring parsing is also supported
    req.query.a; // = [12,33]
    req.query.c; // = 42
});

//Websockets is supported!
server.on('WS /*',async(req, socket, next)=>{
    // Req here - custom object, have all props as on normal http requests
    req.a=123;
    next(); 
});
server.on('WS /a',async(req, socket, next)=>{
    req.a; // = 123
    socket.on('message', msg=>console.log.bind(console));
});

//Also express.js style handlers (Not for WS!):
server.get('/hello',async(req,res,next)=>{
    res.status(201).send('123');
});
```