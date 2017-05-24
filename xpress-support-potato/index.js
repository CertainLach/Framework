import {Server} from 'uws';
import {ProtoDef, Serializer, Parser} from 'protodef';
import Logger from '@meteor-it/logger';
import * as crypto from 'crypto';
import AJSON from '@meteor-it/ajson';

const potatoLogger=new Logger('potato');

function convertDescription(description) {
    potatoLogger.debug('convertDescription  IN: ',description);
    let data=[];
    Object.keys(description).forEach(key=>{
        data.push({
            "name": key,
            "type": description[key]
        });
    });
    potatoLogger.debug('convertDescription OUT: ',data);
    return data;
}
function callRPC(socket, name, args) {
    if(name==='then')
        return;
    console.log(AJSON.stringify(args));
    console.log(name);
    socket.emit('rpc_call',{
        functionName: name,
        args:AJSON.stringify(args)
    });
    //return new Promise(()=>)
}
function getSocketId() {
    return new Promise((res,rej)=>{
        crypto.randomBytes(32, function(ex, buf) {
            var token = buf.toString('base64').replace(/\//g,'a').replace(/\+/g,'a').replace(/\=/g, '');
            res(token);
        });
    });
};
function getCallbackId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char=>{
        let random = Math.random()*16|0;
        let outChr = char == 'x' ? random : (random&0x3|0x8);
        return outChr.toString(16);
    });
}
async function createPotatoSocket(socket) {
    let packetId=0;
    const protocol = {
        "container": "native",
        "varint": "native",
        "byte": "native",
        "bool": "native",
        "switch": "native",
        "string": "cstring",
        "packet": [
            "container", [{
                "name": "name",
                "type": [
                    "mapper", {
                        "type": "varint",
                        "mappings": {}
                    }
                ]
            }, {
                "name": "params",
                "type": [
                    "switch", {
                        "compareTo": "name",
                        "fields": {}
                    }
                ]
            }]
        ]
    };
    
    const proto = new ProtoDef();
    let parser = null;
    let serializer = null;

    // body...
    const target = {
        id:await getSocketId(),
        declarationFinished: false,
        then:null,
        end(...data){
            socket.close(...data);  
        },
        emit(name, data) {
            if (!target.declarationFinished)
                return potatoLogger.error('emit(): Declaration of socket is not finished before usage! Call finishDeclaration before doing anything with socket!',new Error().stack);
            potatoLogger.debug('emit()');
            try{
            serializer.write({
                name: name,
                params: data
            });
            }catch(e){
                console.log(e);
            }
            potatoLogger.debug('/emit()');
        },
        eventListeners:{},
        on(name, handler) {
            if (!target.declarationFinished)
                return potatoLogger.error('on(): Declaration of socket is not finished before usage! Call finishDeclaration before doing anything with socket!');
            potatoLogger.debug('on(%s)',name);
            if(!target.eventListeners[name])
                target.eventListeners[name]=[];
            target.eventListeners[name].push(handler);
            potatoLogger.debug('/on()');
        },
        addPacket(name, description) {
            if (target.declarationFinished)
                return potatoLogger.error('addPacket(): Socket declaration is already finished!');
            potatoLogger.log('Added packet: %s',name.blue);
            description=convertDescription(description);
            let id=packetId++;
            id=id.toString(10);
            protocol.packet[1][0].type[1].mappings[id]=name;
            protocol.packet[1][1].type[1].fields[name]=name;
            protocol[name]=[
                "container", description
            ];
            potatoLogger.debug('addPacket(id: %d, fieldCount: %d)',id,description.length);
        },
        finishDeclaration() {
            if (target.declarationFinished)
                return potatoLogger.error('finishDeclaration(): Socket declaration is already finished!');
            potatoLogger.log('Done declaration');
            //console.log(JSON.stringify(protocol,null,4));
            proto.addTypes(protocol);
            potatoLogger.log('Done adding');
            parser = new Parser(proto, "packet");
            parser.on('data',data=>{
                data=data.data;
                let eventName=data.name;
                if(!target.eventListeners[eventName])
                    return potatoLogger.warn('No listeners defined for %s',eventName);
                let eventData=data.params;
                target.eventListeners[eventName].forEach(eventListener=>{
                    eventListener(eventData);
                });
            });
            serializer = new Serializer(proto, "packet");
            serializer.on('data',(a,b,c)=>{
                socket.send(new Uint8Array(a).buffer); // Convert to arrayBuffer and send
            });
            socket.on('message',m=>{
                console.log(m);
                parser.write(new Buffer(m));
            });
            potatoLogger.log('Done finishing');
            target.declarationFinished = true;
        }
    };
    //console.log(target.id);
    target.addPacket('rpc_call',{
        functionName:'string',
        args:'string'
    });

    return new Proxy(target, {
        get(target, name) {
            return name in target ? target[name] : (...props) => callRPC(target, name, props);
        }
    });
};

export function addSupport(server) {
    server.addPossible('POTATO');
    // Patch xpress to return Websocket support!
    server.potatoWsHandler = async (webSocket) => {
        // Websocket request handler, acts similar to httpHandler()
        // TODO: Provide own req object, instead of upgradeReq
        server.parseReqUrl(webSocket.upgradeReq);
        webSocket.upgradeReq.method = 'POTATO'; // Because upgrade req is a get
        // Socket will be transfered over handlers chain as http response 

        console.log('url: ',webSocket.upgradeReq);
        server.handle(webSocket.upgradeReq, await createPotatoSocket(webSocket), err => {
            // No handlers? Close socket. 404 as in http
            if (process.env.ENV === 'development')
                webSocket.close(404, err ? err.stack : new Error('next() called, but no next handlers are found').stack);
            else
                webSocket.close();
            server.logger.warn('404 Socket url not found at ' + webSocket.upgradeReq.url);
            // Handle any error here
            if (err instanceof Error)
            // We can throw there, but then error will be filled with http internals
            // So, just log
                server.logger.error(err);
            else if (err !== undefined)
            // String/something other thrown? I dont like that...
            // But anyway, lets log them
            server.logger.error(new Error(err));
        }, webSocket.upgradeReq.url);
    };
    server.onListen((httpServer, xpressServer) => {
        const potato = new Server({
            server: httpServer
        });
        potato.on('connection', server.potatoWsHandler);
        xpressServer.logger.log('Added POTATO support!');
    });
}