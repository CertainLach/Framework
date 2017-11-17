import {IEncoder,IEncoderPacket,PacketType} from '../';

export type IPDSDeSerializer = {
    serialize: (data:any, buffer:Buffer, offset: number)=>Buffer,
    deserialize: (data:Buffer,offset:number)=>[any,number],
    sizeOf: (data:any)=>number
}

export type IPDSOutput = {[key:string]:IPDSDeSerializer}

export default class PDSEncoder implements IEncoder {
    constructor(output: IPDSOutput){
        this.processDeclaration(output);
    }

    private randomToRpcId:{[key:number]:number}={};
    private rpcIdToRandom:{[key:number]:number}={};
    setRandomToRpc(random:number,rpc:string){
        let id=this.rpcToId[rpc];
        this.randomToRpcId[random]=id;
        this.rpcIdToRandom[id]=random;
    }
    resetRandomToRpc(random){
        let id=this.randomToRpcId[random];
        delete this.randomToRpcId[random];
        delete this.rpcIdToRandom[id];
    }

    getExistingRpcMethods(): string[] {
        return Object.keys(this.rpcToId);
    }
    hasRpcMethod(name: string): boolean {
        return name in this.rpcToId;
    }

    getExistingEvents(): string[] {
        return Object.keys(this.eventToId);
    }
    hasEvent(name: string): boolean {
        return name in this.eventToId;
    }

    /**
     * Calculates size of resulting packet
     * @param data
     */
    sizeOf(data: IEncoderPacket): number {
        let id:number;
        let serializer:IPDSDeSerializer;
        switch(data.type){
            case PacketType.RPC_CALL:
                // Prepare
                id=this.rpcToId[data.name];
                serializer=this._rpc[id][0];
                return 1+4+1+serializer.sizeOf(data.data); // type + Random + ID + Buffer
            case PacketType.RPC_OK:
                // Prepare
                id=this.randomToRpcId[data.random];
                serializer=this._rpc[id][1];
                return 1+4+serializer.sizeOf(data.data); // type + Random + Buffer
            case PacketType.RPC_ERROR:
                // Prepare
                // Do not need to do anything, since error is always a string
                return 1+4+data.data.length; // type + Random + Buffer
            case PacketType.EVENT:
                // Prepare
                id=this.eventToId[data.name];
                serializer=this._events[id];
                return 1+1+serializer.sizeOf(data.data); // type + ID + Buffer
        }
    }

    encodeData(data: IEncoderPacket): Buffer{
        let length=this.sizeOf(data);
        let buffer=Buffer.allocUnsafe(length);
        buffer.writeUInt8(data.type, 0, true);
        let id:number;
        let serializer:IPDSDeSerializer;
        switch(data.type){
            case PacketType.RPC_CALL:
                // Prepare
                id=this.rpcToId[data.name];
                serializer=this._rpc[id][0];
                // Write
                buffer.writeUInt32LE(data.random,1,true);
                buffer.writeUInt8(id,5,true);
                serializer.serialize(data.data,buffer,6);
                return buffer;
            case PacketType.RPC_OK:
                // Prepare
                id=this.randomToRpcId[data.random];
                serializer=this._rpc[id][1];
                // Write
                buffer.writeUInt32LE(data.random,1,true);
                serializer.serialize(data.data,buffer,5);
                return buffer;
            case PacketType.RPC_ERROR:
                // Prepare
                // Do not need to do anything, since error is always a string
                // Write
                buffer.writeUInt32LE(data.random,1,true);
                Buffer.from(data.data).copy(buffer,5);
                return buffer;
            case PacketType.EVENT:
                // Prepare
                id=this.eventToId[data.name];
                serializer=this._events[id];
                // Write
                buffer.writeUInt8(id,1,true);
                serializer.serialize(data.data,buffer,2);
                return buffer;
        }
    }

    decodeData(buffer:Buffer):IEncoderPacket {
        let type=buffer.readUInt8(0,true);
        let id:number;
        let serializer:IPDSDeSerializer;
        let random:number;
        let data:any;
        let name:string;
        switch(type){
            case PacketType.RPC_CALL:
                random=buffer.readUInt32LE(1,true);
                id=buffer.readUInt8(5,true);
                serializer=this._rpc[id][0];
                name=this.idToRpc[id];
                data=serializer.deserialize(buffer,6);
                return {
                    type,
                    name,
                    data,
                    random
                };
            case PacketType.RPC_OK:
                random=buffer.readUInt32LE(1,true);
                id=this.randomToRpcId[data.random];
                serializer=this._rpc[id][1];
                data=serializer.deserialize(buffer,5);
                return {
                    type,
                    data,
                    random
                };
            case PacketType.RPC_ERROR:
                random=buffer.readUInt32LE(1,true);
                data=buffer.slice(5).toString();
                return {
                    type,
                    data,
                    random
                };
            case PacketType.EVENT:
                id=buffer.readUInt8(1,true);
                name=this.idToEvent[id];
                serializer=this._events[id];
                data=serializer.deserialize(buffer,2);
                return {
                    type,
                    name,
                    data
                };
        }
    }

    /**
     * Helpers
     */

    /**
     * Serialize via protodef
     * @param data data to serialize
     * @param declaration serializer
     */
    serializeByDeclaration(data:any,declaration:IPDSDeSerializer):Buffer{
        let length=declaration.sizeOf(data);
        let buffer=Buffer.allocUnsafe(length);
        declaration.serialize(data,buffer,0);
        return buffer;
    }

    /**
     * Deserialize via protodef
     * @param buffer data to deserialize
     * @param declaration deserializer
     */
    deserializeByDeclaration(buffer:Buffer,declaration:IPDSDeSerializer):any{
        return declaration.deserialize(buffer, 0)[0];
    }

    /**
     * Declaration part
     */

    /**
     * Id's should equal on sender and receiver
     * @type {number}
     */
    lastRpcEventId=0x0;
    lastNormalEventId=0x0;
    /**
     * id=>[request declaration,response declaration] map
     */
    _rpc:[IPDSDeSerializer,IPDSDeSerializer][]=[];
    _events:IPDSDeSerializer[]=[];

    /**
     * event name=>id map
     */
    rpcToId:{[key:string]:number}={};
    eventToId:{[key:string]:number}={};

    /**
     * id=>event name map
     */
    idToRpc:{[key:number]:string}={};
    idToEvent:{[key:number]:string}={};

    /**
     * Add event (used in initialization stage)
     * @param event
     * @param declaration
     */
    processAddNormalEvent(event:string,declaration:IPDSDeSerializer){
        let id=this.lastNormalEventId++;
        this.eventToId[event]=id;
        this.idToEvent[id]=event;
        this._events[id]=declaration;
    }

    /**
     * Add RPC method (used in initialization stage)
     * @param eventPath
     * @param request
     * @param response
     */
    processAddRpcMethod(eventPath:string,request:IPDSDeSerializer,response:IPDSDeSerializer){
        let id=this.lastRpcEventId++;
        this.rpcToId[eventPath]=id;
        this.idToRpc[id]=eventPath;
        this._rpc[id]=[request,response];
    }

    /**
     * Add events/methods (used in initialization stage)
     * @param declaration declaration to process
     */
    processDeclaration(declaration:IPDSOutput) {
        let keys=Object.keys(declaration).sort();
        for(let key of keys){
            if(!declaration.hasOwnProperty(key))
                continue;
            let lastParts=key.split('::');
            let lastPart=lastParts[lastParts.length-1];
            if(lastPart!=='request'&&lastPart!=='response'){
                let path = key.split('::');
                if(path[0]==='')
                    path=path.slice(1);
                this.processAddNormalEvent(path.join('.'),declaration[key]);
            }else{
                let path = key.split('::').slice(0,-1);
                if(path[0]==='')
                    path=path.slice(1);
                let prefix = key.slice(0,key.lastIndexOf('::'));
                if(this.rpcToId[path.join('.')])
                    continue;
                let requestDeclaration=declaration[prefix+'::request'];
                let responseDeclaration=declaration[prefix+'::response'];
                if(!requestDeclaration)
                    throw new Error(`Rpc call ${prefix} has no request declaration!`);
                if(!responseDeclaration)
                    throw new Error(`Rpc call ${prefix} has no response declaration!`);
                this.processAddRpcMethod(path.join('.'),requestDeclaration,responseDeclaration);
            }
        }
    }
}