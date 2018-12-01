# XPress

Websockets and others are moved to `@meteor-it/xpress/support/*`
To use them do: 
```js
import XPress from '@meteor-it/xpress';
import addWSSupport from '@meteor-it/xpress/support/ws';

const server=new XPress('name');
server.onListen(addWSSupport);
//... use as before!
```
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

//Also express.js style handlers (Not for WS!):
server.get('/hello',async(req,res,next)=>{
    res.status(201).send('123');
});
```

## Now with HTTP2 support!