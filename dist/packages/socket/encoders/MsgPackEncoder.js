"use strict";
const _1 = require("../");
const msgpack_lite_1 = require("msgpack-lite");
class MsgPackEncoder {
    constructor() {
    }
    setRandomToRpc(random, rpc) { }
    resetRandomToRpc(random) { }
    getExistingRpcMethods() {
        return ['any 2 part'];
    }
    hasRpcMethod(name) {
        if (name.split('.').length === 2)
            return true;
        return false;
    }
    getExistingEvents() {
        return ['any'];
    }
    hasEvent(name) {
        return true;
    }
    encodeData(data) {
        switch (data.type) {
            case _1.PacketType.RPC_CALL:
                return msgpack_lite_1.default.encode({
                    t: data.type,
                    n: data.name,
                    d: data.data,
                    r: data.random
                });
            case _1.PacketType.RPC_OK:
                return msgpack_lite_1.default.encode({
                    t: data.type,
                    d: data.data,
                    r: data.random
                });
            case _1.PacketType.RPC_ERROR:
                return msgpack_lite_1.default.encode({
                    t: data.type,
                    d: data.data,
                    r: data.random
                });
            case _1.PacketType.EVENT:
                return msgpack_lite_1.default.encode({
                    t: data.type,
                    n: data.name,
                    d: data.data
                });
        }
    }
    decodeData(buffer) {
        let data = msgpack_lite_1.default.decode(buffer);
        switch (data.t) {
            case _1.PacketType.RPC_CALL:
                return {
                    type: data.t,
                    name: data.n,
                    data: data.d,
                    random: data.r
                };
            case _1.PacketType.RPC_OK:
                return {
                    type: data.t,
                    data: data.d,
                    random: data.r
                };
            case _1.PacketType.RPC_ERROR:
                return {
                    type: data.t,
                    data: data.d,
                    random: data.r
                };
            case _1.PacketType.EVENT:
                return {
                    type: data.t,
                    name: data.n,
                    data: data.d
                };
        }
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = MsgPackEncoder;
//# sourceMappingURL=MsgPackEncoder.js.map