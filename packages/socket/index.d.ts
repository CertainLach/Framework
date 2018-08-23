/// <reference types="node" />
import Logger from '@meteor-it/logger';
export declare class RPCError extends Error {
    constructor(message: string);
}
/**
 * Helper interfaces
 */
export declare type IClientOpenHandler = () => PromisableVoid;
export declare type IClientCloseHandler = (status: number) => PromisableVoid;
export declare type IClientOpenCloseHandler = IClientOpenHandler | IClientCloseHandler;
export declare type IServerOpenHandler<T> = (socket: T) => PromisableVoid;
export declare type IServerCloseHandler<T> = (socket: T, status: number) => PromisableVoid;
export declare type IServerOpenCloseHandler<T> = IServerOpenHandler<T> | IServerCloseHandler<T>;
/**
 * Values there is used by mine very old arduino project...
 *
 * 0b12345678
 *       xxxx - Reserved in potato.socket
 * 1-RPC(1)/EVENT(0)
 * 2-RESPONSE (Events are always = response, even if it is first event sent in session)
 * 3-OK(1)/ERR(0) (If RESPONSE bit is 1, events are always OK)
 * 4-LENGTH%2
 * 5-IS PING
 * 6-PING(0)/PONG(1) (Currently unused)
 * 7-AOK (1 if TCP)
 * 8-DOK (1 if UDP)
 *
 * Potato socket are currently not manages thier ipv4/ipv6 stack in this project,
 * so 7 and 8 bits are unused
 */
export declare const IS_RPC = 128;
export declare const IS_RES = 64;
export declare const IS_OK = 32;
export declare const IS_MULT_OF_2 = 16;
export declare const IS_TEST = 8;
export declare const IS_PING = 4;
export declare const IS_AOK = 2;
export declare const IS_DOK = 1;
export declare enum PacketType {
    RPC_CALL = 130,
    RPC_ERROR = 194,
    RPC_OK = 226,
    EVENT = 98,
}
/**
 * Packet
 */
export interface IRPCCallPacket {
    type: PacketType.RPC_CALL;
    name: string;
    random: number;
    data: any;
}
export interface IRPCErrorPacket {
    type: PacketType.RPC_ERROR;
    serializerName?: string;
    random: number;
    data: string;
}
export interface IRPCOkPacket {
    type: PacketType.RPC_OK;
    serializerName?: string;
    random: number;
    data: any;
}
export interface IEventPacket {
    type: PacketType.EVENT;
    name: string;
    data: any;
}
export declare type IEncoderPacket = IRPCCallPacket | IRPCErrorPacket | IRPCOkPacket | IEventPacket;
/**
 * Encoder
 */
export interface IEncoder {
    decodeData(data: Buffer): IEncoderPacket;
    encodeData(data: IEncoderPacket): Buffer;
    setRandomToRpc(random: number, rpc: string): void;
    resetRandomToRpc(random: number): void;
    hasRpcMethod(name: string): boolean;
    getExistingRpcMethods(): string[];
    hasEvent(name: string): boolean;
    getExistingEvents(): string[];
}
/**
 * Handler
 */
export declare type IRPCHandlerWithoutThis = (data: any) => Promise<any>;
export declare type IRPCHandlerWithThis<T> = (socket: T, data: any) => Promise<any>;
export declare type IEventHandlerWithoutThis = (name: 'open' | 'close' | string, handler: (data: any) => PromisableVoid) => void;
export declare type IEventHandlerWithThis<T> = (name: 'open' | 'close' | string, handler: (socket: T, data: any) => PromisableVoid) => void;
/**
 * Misc
 */
export declare type IRPCFieldWithoutThis = {
    [key: string]: IRPCHandlerWithoutThis | IRPCFieldWithoutThis;
};
export declare type IRPCFieldWithThis<T> = {
    [key: string]: IRPCHandlerWithThis<T> | IRPCFieldWithThis<T>;
};
export declare type IRPCField<T> = IRPCFieldWithoutThis | IRPCFieldWithThis<T>;
export declare type PromisableVoid = void | Promise<void>;
export declare type IRPCMethodList<T> = {
    [key: string]: IRPCHandlerWithoutThis | IRPCHandlerWithThis<T>;
};
export declare type IEventHandlerList<T> = {
    [key: string]: (IEventHandlerWithThis<T> | IEventHandlerWithoutThis)[];
};
/**
 * Common potato.socket implementation
 * Universal side (Use any protocol)
 */
export declare class PotatoSocketUniversal<F> {
    logger: Logger;
    /**
     * Is socket managed by something?
     * If true - pass 'this' to event/rpc handlers
     */
    readonly isManaged: boolean;
    /**
     * Is server socket?
     */
    isServer: boolean;
    server?: any;
    /**
     * Encoder manages data (de)serialization
     */
    encoder: IEncoder;
    /**
     * Timeout for RPC calls
     */
    timeout: number;
    constructor(name: string | Logger, encoder: IEncoder, server?: any, timeout?: number);
    /**
     * Local defined RPC methods
     * methodId=>handler map
     */
    rpcMethods: IRPCMethodList<this>;
    /**
     * Local defined event handlers
     * eventId=>[...handlers] map
     */
    eventHandlers: IEventHandlerList<this>;
    local: {
        emit: (name: string, data: any) => boolean;
        on: (name: string, handler: (data: any) => void | Promise<void>) => never;
        readonly rpc: F;
    };
    remote: {
        emit: (name: string, data: any) => boolean;
        on: (name: string, handler: IEventHandlerWithoutThis) => void;
        rpc: () => F;
    };
    rpc(): any;
    emit(name: string, data: any): boolean;
    on(name: string, handler: IRPCHandlerWithThis<this> | IRPCHandlerWithoutThis): void;
    /**
     * Random emulation
     */
    lastRpcMethodCallId: number;
    /**
     * random=>[resolve,reject] map
     */
    pendingRemoteRPCCalls: {
        [key: number]: [(data: any) => any, (error: Error) => any];
    };
    /**
     * Rpc call (sender side)
     * @param method method id to call
     * @param data raw data
     */
    private callRemoteMethod(method, data);
    /**
     * Rpc call (receiver side)
     * @param packet
     */
    onLocalMethodCall(packet: IRPCCallPacket): void;
    /**
     * Rpc error (sender side)
     * @param random
     * @param methodName
     * @param rpcError
     */
    answerErrorOnRPCCall(random: number, methodName: string, rpcError: string): void;
    /**
     * Rpc error (receiver side)
     * @param packet
     */
    onRemoteMethodError(packet: IRPCErrorPacket): void;
    /**
     * Rpc ok (sender side)
     * @param random
     * @param methodName
     * @param data
     */
    answerOkOnRPCCall(random: number, methodName: string, data: any): void;
    /**
     * Rpc ok (receiver side)
     * @param packet
     */
    onRemoteMethodOk(packet: IRPCOkPacket): void;
    /**
     * Called when packet with tag: event received
     * @param packet
     */
    onRemoteEvent(packet: IEventPacket): void;
    /**
     * Networking.
     * Send buffer to receiver side
     * @param buffer
     */
    sendBufferToRemote(buffer: Buffer): void;
    /**
     * Networking
     * Got buffer from sender side
     * @param buffer
     */
    gotBufferFromRemote(buffer: Buffer): void;
}
