import { IEncoder, IEncoderPacket, PacketType } from '../';
import msgpack from 'msgpack-lite';

// noinspection JSUnusedGlobalSymbols
/**
 * Encodes packets with msgpack
 */
export default class MsgPackEncoder implements IEncoder {
    /**
     * Schemaless encoder built on MsgPack
     */
    constructor() {
    }

    setRandomToRpc(random: number, rpc: string) { }
    resetRandomToRpc(random: number) { }

    getExistingRpcMethods(): string[] {
        return ['any'];
    }
    hasRpcMethod(name: string): boolean {
        return true;
    }

    getExistingEvents(): string[] {
        return ['any'];
    }
    hasEvent(name: string): boolean {
        return true;
    }

    encodeData(data: IEncoderPacket): Buffer {
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
    }

    decodeData(buffer: Buffer): IEncoderPacket {
        let data: { t: PacketType, n: string, d: Buffer | string, r: number } = msgpack.decode(buffer);
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
                    data: data.d as string,
                    random: data.r
                };
            case PacketType.EVENT:
                return {
                    type: data.t,
                    name: data.n,
                    data: data.d
                };
        }
    }

}
