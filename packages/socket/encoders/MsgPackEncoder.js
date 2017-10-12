import { PacketType } from '../';
import msgpack from 'msgpack-lite';
var MsgPackEncoder = /** @class */ (function () {
    /**
     * Schemaless encoder built on MsgPack
     */
    function MsgPackEncoder() {
    }
    MsgPackEncoder.prototype.setRandomToRpc = function (random, rpc) { };
    MsgPackEncoder.prototype.resetRandomToRpc = function (random) { };
    MsgPackEncoder.prototype.getExistingRpcMethods = function () {
        return ['any 2 part'];
    };
    MsgPackEncoder.prototype.hasRpcMethod = function (name) {
        if (name.split('.').length === 2)
            return true;
        return false;
    };
    MsgPackEncoder.prototype.getExistingEvents = function () {
        return ['any'];
    };
    MsgPackEncoder.prototype.hasEvent = function (name) {
        return true;
    };
    MsgPackEncoder.prototype.encodeData = function (data) {
        switch (data.type) {
            case PacketType.RPC_CALL:
                return msgpack.encode({
                    t: data.type,
                    n: data.name,
                    d: data.data,
                    r: data.random
                });
            case PacketType.RPC_OK:
                return msgpack.encode({
                    t: data.type,
                    d: data.data,
                    r: data.random
                });
            case PacketType.RPC_ERROR:
                return msgpack.encode({
                    t: data.type,
                    d: data.data,
                    r: data.random
                });
            case PacketType.EVENT:
                return msgpack.encode({
                    t: data.type,
                    n: data.name,
                    d: data.data
                });
        }
    };
    MsgPackEncoder.prototype.decodeData = function (buffer) {
        var data = msgpack.decode(buffer);
        switch (data.t) {
            case PacketType.RPC_CALL:
                return {
                    type: data.t,
                    name: data.n,
                    data: data.d,
                    random: data.r
                };
            case PacketType.RPC_OK:
                return {
                    type: data.t,
                    data: data.d,
                    random: data.r
                };
            case PacketType.RPC_ERROR:
                return {
                    type: data.t,
                    data: data.d,
                    random: data.r
                };
            case PacketType.EVENT:
                return {
                    type: data.t,
                    name: data.n,
                    data: data.d
                };
        }
    };
    return MsgPackEncoder;
}());
export default MsgPackEncoder;
//# sourceMappingURL=MsgPackEncoder.js.map