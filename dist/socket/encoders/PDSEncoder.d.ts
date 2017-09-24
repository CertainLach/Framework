/// <reference types="node" />
import { IEncoder, IEncoderPacket } from '../';
export declare type IPDSDeSerializer = {
    serialize: (data: any, buffer: Buffer, offset: number) => Buffer;
    deserialize: (data: Buffer, offset: number) => [any, number];
    sizeOf: (data: any) => number;
};
export declare type IPDSOutput = {
    [key: string]: IPDSDeSerializer;
};
export default class PDSEncoder implements IEncoder {
    constructor(output: IPDSOutput);
    private randomToRpcId;
    private rpcIdToRandom;
    setRandomToRpc(random: number, rpc: string): void;
    resetRandomToRpc(random: any): void;
    getExistingRpcMethods(): string[];
    hasRpcMethod(name: string): boolean;
    getExistingEvents(): string[];
    hasEvent(name: string): boolean;
    sizeOf(data: IEncoderPacket): number;
    encodeData(data: IEncoderPacket): Buffer;
    decodeData(buffer: Buffer): IEncoderPacket;
    serializeByDeclaration(data: any, declaration: IPDSDeSerializer): Buffer;
    deserializeByDeclaration(buffer: Buffer, declaration: IPDSDeSerializer): any;
    lastRpcEventId: number;
    lastNormalEventId: number;
    _rpc: [IPDSDeSerializer, IPDSDeSerializer][];
    _events: IPDSDeSerializer[];
    rpcToId: {
        [key: string]: number;
    };
    eventToId: {
        [key: string]: number;
    };
    idToRpc: {
        [key: number]: string;
    };
    idToEvent: {
        [key: number]: string;
    };
    processAddNormalEvent(event: string, declaration: IPDSDeSerializer): void;
    processAddRpcMethod(eventPath: string, request: IPDSDeSerializer, response: IPDSDeSerializer): void;
    processDeclaration(declaration: IPDSOutput): void;
}
