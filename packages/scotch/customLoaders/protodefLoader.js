const {cwrap} = require('./protodefc.js');
const compilation_unit_to_javascript = cwrap('compilation_unit_to_javascript', 'string', ['string']);


module.exports=function(protocolSource){
    let content= `var types={"::i8":{size_of:function(){return 1},serialize:function(b,a,c){return a.writeInt8(b,c),c+1},deserialize:function(b,a){return[b.readInt8(a),a+1]}},"::u8":{size_of:function(){return 1},serialize:function(b,a,c){return a.writeInt8(b,c),c+1},deserialize:function(b,a){return[b.readInt8(a),a+1]}},"::i16":{size_of:function(){return 2},serialize:function(b,a,c){return a.writeInt16BE(b,c),c+2},deserialize:function(b,a){return[b.readInt16BE(a),a+2]}},"::u16":{size_of:function(){return 2},serialize:function(b,a,c){return a.writeUInt16BE(b,c),c+2},deserialize:function(b,a){return[b.readUInt16BE(a),a+2]}},"::i32":{size_of:function(){return 4},serialize:function(b,a,c){return a.writeInt32BE(b,c),c+4},deserialize:function(b,a){return[b.readInt32BE(a),a+4]}},"::u32":{size_of:function(){return 4},serialize:function(b,a,c){return a.writeUInt32BE(b,c),c+4},deserialize:function(b,a){return[b.readUInt32BE(a),a+4]}},"::i64":{size_of:function(){return 8},serialize:function(b,a,c){return a.writeInt64BE(b,c),c+8},deserialize:function(b,a){return[b.readInt64BE(a),a+8]}},"::u64":{size_of:function(){return 8},serialize:function(b,a,c){return a.writeUInt64BE(b,c),c+8},deserialize:function(b,a){return[b.readUInt64BE(a),a+8]}},"::varint":{size_of:function(b){for(var a=0;-128&b;)b>>>=7,a++;return a+1}},"::sized_string":{size_of:function(b){return Buffer.byteLength(b,"utf8")},serialize:function(b,a,c){return c+a.write(b,c)},deserialize:function(b,a,c){return[b.toString("utf8",a,a+c),a+c]}},"::unit":{size_of:function(){return 0},serialize:function(b,a,c){return c},deserialize:function(b,a){return[null,a]}}};`;
    try {
        content += compilation_unit_to_javascript(protocolSource);
    }catch(e){
        this.callback(e);
        return;
    }
    content+=';module.exports=exports;';
    this.callback(null,content.replace(/(_[a-z0-9])/g,a=>a.substr(1).toUpperCase()));
};