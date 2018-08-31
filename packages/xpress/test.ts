import XPress from './';

const app = new XPress('test');

app.on('GET','/test/(.*)',({req,res,next,params})=>{
    console.log(params);
});

app.listenHttp('0.0.0.0',8081);