// <Name <=> ID> maps
const TAG_MAP={
    'rpcCall':2,
    'rpcOk':3,
    'rpcErr':4,
    'ping':6,
    'pong':7,
    'event':0
};
const ID_MAP={
    2:'rpcCall',
    3:'rpcOk',
    4:'rpcErr',
    6:'ping',
    7:'pong',
    0:'event'
};

function sizeOf(data){
    let size=1; // tag
    switch(data.tag){
        case 'rpcCall':
        case 'rpcOk':
        case 'rpcErr':
            size+=4; // random
            size+=1; // id
            size+=data.data.body.body.length; // buffer
            break;
        case 'event':
            size+=1; // id
            size+=data.data.body.length; // buffer
            break;
        case 'ping':
        case 'pong':
            size+=4;
            break;
        default:
            throw new Error('Unknown tag: '+data.tag);
    }
    return size;
}
function serialize(data,buffer){
    buffer.writeUInt8(TAG_MAP[data.tag], 0, true);
    switch(data.tag){
        case 'rpcCall':
        case 'rpcOk':
        case 'rpcErr':
            buffer.writeUInt32BE(data.data.random,1,true);
            buffer.writeUInt8(data.data.body.eventId, 5, true);
            Buffer.from(data.data.body.body).copy(buffer,6);
            break;
        case 'event':
            buffer.writeUInt8(data.data.eventId, 1, true);
            Buffer.from(data.data.body).copy(buffer,2);
            break;
        case 'ping':
        case 'pong':
            buffer.writeUInt32BE(data.data, 1, true);
            break;
        default:
            throw new Error('Unknown tag: '+data.tag);
    }
}
function deserialize(buffer){
    let data={
        tag:ID_MAP[buffer.readUInt8(0, true)]
    };
    switch(data.tag){
        case 'rpcCall':
        case 'rpcOk':
        case 'rpcErr':
            data.data={
                random: buffer.readUInt32BE(1,true),
                body: {
                    eventId: buffer.readUInt8(5,true),
                    body: buffer.slice(6)
                }
            };
            break;
        case 'event':
            data.data={
                eventId: buffer.readUInt8(1,true),
                body: buffer.slice(2)
            };
            break;
        case 'ping':
        case 'pong':
            data.data=buffer.readUInt32BE(1,true);
            break;
        default:
            throw new Error('Unknown tag: '+data.tag);
    }

    return [data,0];
}

module.exports = {
    "potatoSocket": {sizeOf, serialize, deserialize}
};