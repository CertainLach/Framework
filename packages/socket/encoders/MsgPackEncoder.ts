import {IEncoder,IEncoderPacket,PacketType} from '../';
import msgpack from 'msgpack-lite';

export default class MsgPackEncoder implements IEncoder {
    /**
     * Schemaless encoder built on MsgPack
     */
    constructor(){
    }

    setRandomToRpc(random:number,rpc:string){}
    resetRandomToRpc(random){}

    getExistingRpcMethods(): string[] {
        return ['any 2 part'];
    }
    hasRpcMethod(name: string): boolean {
        if(name.split('.').length===2)
            return true;
        return false;
    }

    getExistingEvents(): string[] {
        return ['any'];
    }
    hasEvent(name: string): boolean {
        return true;
    }

    encodeData(data: IEncoderPacket): Buffer{
        switch(data.type){
            case PacketType.RPC_CALL:
                return msgpack.encode({
                    t:data.type,
                    n:data.name,
                    d:data.data,
                    r:data.random
                });
            case PacketType.RPC_OK:
                return msgpack.encode({
                    t:data.type,
                    d:data.data,
                    r:data.random
                });
            case PacketType.RPC_ERROR:
                return msgpack.encode({
                    t:data.type,
                    d:data.data,
                    r:data.random
                });
            case PacketType.EVENT:
                return msgpack.encode({
                    t:data.type,
                    n:data.name,
                    d:data.data
                });
        }
    }

    decodeData(buffer:Buffer):IEncoderPacket {
        let data=msgpack.decode(buffer);
        switch(data.t){
            case PacketType.RPC_CALL:
                return {
                    type:data.t,
                    name:data.n,
                    data:data.d,
                    random:data.r
                };
            case PacketType.RPC_OK:
                return {
                    type:data.t,
                    data:data.d,
                    random:data.r
                };
            case PacketType.RPC_ERROR:
                return {
                    type:data.t,
                    data:data.d,
                    random:data.r
                };
            case PacketType.EVENT:
                return {
                    type:data.t,
                    name:data.n,
                    data:data.d
                };
        }
    }

}