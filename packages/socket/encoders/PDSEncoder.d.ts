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
    /**
     * Calculates size of resulting packet
     * @param data
     */
    sizeOf(data: IEncoderPacket): number;
    encodeData(data: IEncoderPacket): Buffer;
    decodeData(buffer: Buffer): IEncoderPacket;
    /**
     * Helpers
     */
    /**
     * Serialize via protodef
     * @param data data to serialize
     * @param declaration serializer
     */
    serializeByDeclaration(data: any, declaration: IPDSDeSerializer): Buffer;
    /**
     * Deserialize via protodef
     * @param buffer data to deserialize
     * @param declaration deserializer
     */
    deserializeByDeclaration(buffer: Buffer, declaration: IPDSDeSerializer): any;
    /**
     * Declaration part
     */
    /**
     * Id's should equal on sender and receiver
     * @type {number}
     */
    lastRpcEventId: number;
    lastNormalEventId: number;
    /**
     * id=>[request declaration,response declaration] map
     */
    _rpc: [IPDSDeSerializer, IPDSDeSerializer][];
    _events: IPDSDeSerializer[];
    /**
     * event name=>id map
     */
    rpcToId: {
        [key: string]: number;
    };
    eventToId: {
        [key: string]: number;
    };
    /**
     * id=>event name map
     */
    idToRpc: {
        [key: number]: string;
    };
    idToEvent: {
        [key: number]: string;
    };
    /**
     * Add event (used in initialization stage)
     * @param event
     * @param declaration
     */
    processAddNormalEvent(event: string, declaration: IPDSDeSerializer): void;
    /**
     * Add RPC method (used in initialization stage)
     * @param eventPath
     * @param request
     * @param response
     */
    processAddRpcMethod(eventPath: string, request: IPDSDeSerializer, response: IPDSDeSerializer): void;
    /**
     * Add events/methods (used in initialization stage)
     * @param declaration declaration to process
     */
    processDeclaration(declaration: IPDSOutput): void;
}
