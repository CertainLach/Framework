import {emit} from '@meteor-it/xrest';
import * as multipart from '@meteor-it/xrest/multipart';

export default class Rghost{
    async upload(stream,fileName,size){
        let res=await emit('GET http://rghost.net/multiple/upload_host',{
            headers:{
                Host:'rghost.net',
                'User-Agent':'rgup 1.3'
            }
        });
        let host=res.body.upload_host;
        let sent=await emit(`POST http://${host}/files`,{
            multipart:true,
            timeout:0,
            data:{
                authenticity_token:res.body.authenticity_token,
                file:new multipart.FileStream(stream, fileName, size, 'binary', 'text/plain')
            },
            headers:{
                Host:host,
                'User-Agent':'rgup 1.3',
                Cookie:res.headers['set-cookie']
            }
        });
        return sent.body;
    }
}