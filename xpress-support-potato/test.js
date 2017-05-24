import XPress from '@meteor-it/xpress';
import {addSupport as addPotatoSupport} from '@meteor-it/xpress-support-potato';

const server=new XPress('ptest');
addPotatoSupport(server);

server.on('POTATO /',(req,potato)=>{
    potato.addPacket('test',{
        a:'string'     
    });
    potato.finishDeclaration();
    //while(1)
    potato.on('test',(a)=>{
        console.log(a);
    });
    potato.emit('test',{
        a:'123412124'
    });
    potato.getData();
});
server.listenHttp('0.0.0.0',8081);