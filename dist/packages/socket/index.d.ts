/// <reference types="node" />
import Logger from '@meteor-it/logger';
export declare class WebSocketClient {
    number: number;
    autoReconnectInterval: any;
    url: any;
    instance: any;
    safeClose: boolean;
    constructor(url: any, reconnectInterval?: number);
    open(): void;
    close(): void;
    sendBuffer: any[];
    send(data: any, option?: any): void;
    reconnect(): void;
    onOpenResend(): void;
    onopen(): void;
    onmessage(data: any, flags: any, number: any): void;
    onerror(e: any): void;
    onclose(e: any): void;
}
export declare class RPCError extends Error {
    constructor(message: any);
}
export declare type IClientOpenHandler = () => PromisableVoid;
export declare type IClientCloseHandler = (status: number) => PromisableVoid;
export declare type IClientOpenCloseHandler = IClientOpenHandler | IClientCloseHandler;
export declare type IServerOpenHandler = (socket) => PromisableVoid;
export declare type IServerCloseHandler = (socket, status: number) => PromisableVoid;
export declare type IServerOpenCloseHandler = IServerOpenHandler | IServerCloseHandler;
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
export interface IEncoder {
    decodeData(data: Buffer): IEncoderPacket;
    encodeData(data: IEncoderPacket): Buffer;
    setRandomToRpc(random: number, rpc: string): any;
    resetRandomToRpc(random: any): any;
    hasRpcMethod(name: string): boolean;
    getExistingRpcMethods(): string[];
    hasEvent(name: string): boolean;
    getExistingEvents(): string[];
}
export declare type IRPCHandlerWithoutThis = (data: any) => Promise<any>;
export declare type IRPCHandlerWithThis = (socket: PotatoSocketUniversal, data: any) => Promise<any>;
export declare type IEventHandlerWithoutThis = (name: 'open' | 'close' | string, handler: (data: any) => PromisableVoid) => void;
export declare type IEventHandlerWithThis = (name: 'open' | 'close' | string, handler: (socket, data: any) => PromisableVoid) => void;
export declare type IRPCFieldWithoutThis = {
    [key: string]: IRPCField | IRPCHandlerWithoutThis;
};
export declare type IRPCFieldWithThis = {
    [key: string]: IRPCField | IRPCHandlerWithThis;
};
export declare type IRPCField = IRPCFieldWithoutThis | IRPCFieldWithThis;
export declare type PromisableVoid = void | Promise<void>;
export declare type IRPCMethodList = {
    [key: string]: IRPCHandlerWithoutThis | IRPCHandlerWithThis;
};
export declare type IEventHandlerList = {
    [key: string]: (IEventHandlerWithThis | IEventHandlerWithoutThis)[];
};
export declare class PotatoSocketUniversal {
    logger: Logger;
    readonly isManaged: boolean;
    isServer: boolean;
    server?: any;
    encoder: IEncoder;
    timeout: number;
    constructor(name: string | Logger, encoder: IEncoder, server?: any, timeout?: number);
    rpcMethods: IRPCMethodList;
    eventHandlers: IEventHandlerList;
    local: {
        emit: (name: string, data: any) => boolean;
        on: (name: string, handler: (data: any) => void | Promise<void>) => never;
        readonly rpc: IRPCFieldWithoutThis;
    };
    remote: {
        emit: (name: string, data: any) => boolean;
        on: (name: string, handler: IEventHandlerWithThis | IEventHandlerWithoutThis) => void;
        rpc: () => any;
    };
    rpc(): IRPCFieldWithoutThis;
    emit(name: string, data: any): boolean;
    on(name: string, handler: IRPCHandlerWithThis | IRPCHandlerWithoutThis): void;
    lastRpcMethodCallId: number;
    pendingRemoteRPCCalls: {
        [key: number]: [(data: any) => any, (error: Error) => any];
    };
    private callRemoteMethod(method, data);
    onLocalMethodCall(packet: IRPCCallPacket): void;
    answerErrorOnRPCCall(random: number, methodName: string, rpcError: string): void;
    onRemoteMethodError(packet: IRPCErrorPacket): void;
    answerOkOnRPCCall(random: number, methodName: string, data: any): void;
    onRemoteMethodOk(packet: IRPCOkPacket): void;
    onRemoteEvent(packet: IEventPacket): void;
    sendBufferToRemote(buffer: any): void;
    gotBufferFromRemote(buffer: any): void;
}
