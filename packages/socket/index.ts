import Logger from '@meteor-it/logger';

export class RPCError extends Error {
    constructor(message: string) {
        super(message);
    }
}

/**
 * Helper interfaces
 */
export type IClientOpenHandler = () => PromisableVoid;
export type IClientCloseHandler = (status: number) => PromisableVoid;
// noinspection JSUnusedGlobalSymbols
export type IClientOpenCloseHandler = IClientOpenHandler | IClientCloseHandler;

export type IServerOpenHandler<T> = (socket: T) => PromisableVoid;
export type IServerCloseHandler<T> = (socket: T, status: number) => PromisableVoid;
// noinspection JSUnusedGlobalSymbols
export type IServerOpenCloseHandler<T> = IServerOpenHandler<T> | IServerCloseHandler<T>;

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
let jsDocDontMakeMeCry;

// noinspection JSUnusedGlobalSymbols
export const IS_RPC = 0b10000000;
// noinspection JSUnusedGlobalSymbols
export const IS_RES = 0b01000000;
// noinspection JSUnusedGlobalSymbols
export const IS_OK = 0b00100000;
// noinspection JSUnusedGlobalSymbols
export const IS_MULT_OF_2 = 0b00010000;
// noinspection JSUnusedGlobalSymbols
export const IS_TEST = 0b00001000;
// noinspection JSUnusedGlobalSymbols
export const IS_PING = 0b00000100;
// noinspection JSUnusedGlobalSymbols
export const IS_AOK = 0b00000010;
// noinspection JSUnusedGlobalSymbols
export const IS_DOK = 0b00000001;

export enum PacketType {
    RPC_CALL = 0b10000010, // IS_RPC|IS_AOK
    RPC_ERROR = 0b11000010, // IS_RPC|IS_RES|IS_AOK
    RPC_OK = 0b11100010, // IS_RPC|IS_RES|IS_OK|IS_AOK
    EVENT = 0b01100010  // IS_RES|IS_OK|IS_AOK
}

/**
 * Packet
 */
export interface IRPCCallPacket {
    type: PacketType.RPC_CALL,
    name: string,
    random: number,
    data: any
}

export interface IRPCErrorPacket {
    type: PacketType.RPC_ERROR,
    serializerName?: string,
    random: number,
    data: string
}

export interface IRPCOkPacket {
    type: PacketType.RPC_OK,
    serializerName?: string,
    random: number,
    data: any
}

export interface IEventPacket {
    type: PacketType.EVENT,
    name: string,
    data: any
}
export type IEncoderPacket = IRPCCallPacket | IRPCErrorPacket | IRPCOkPacket | IEventPacket;

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
export type IRPCHandlerWithoutThis = (data: any) => Promise<any>;
export type IRPCHandlerWithThis<T> = (socket: T, data: any) => Promise<any>;

export type IEventHandlerWithoutThis = (name: 'open' | 'close' | string, handler: (data: any) => PromisableVoid) => void;
export type IEventHandlerWithThis<T> = (name: 'open' | 'close' | string, handler: (socket: T, data: any) => PromisableVoid) => void;
/**
 * Misc
 */
export type IRPCFieldWithoutThis = { [key: string]: IRPCHandlerWithoutThis | IRPCFieldWithoutThis };
export type IRPCFieldWithThis<T> = { [key: string]: IRPCHandlerWithThis<T> | IRPCFieldWithThis<T> };
export type IRPCField<T> = IRPCFieldWithoutThis | IRPCFieldWithThis<T>;
export type PromisableVoid = void | Promise<void>;

export type IRPCMethodList<T> = { [key: string]: IRPCHandlerWithoutThis | IRPCHandlerWithThis<T> };
export type IEventHandlerList<T> = { [key: string]: (IEventHandlerWithThis<T> | IEventHandlerWithoutThis)[] }

// noinspection JSUnusedGlobalSymbols
/**
 * Common potato.socket implementation
 * Universal side (Use any protocol)
 */
export class PotatoSocketUniversal<F> {
    logger: Logger;

    /**
     * Is socket managed by something?
     * If true - pass 'this' to event/rpc handlers
     */
    get isManaged() {
        return this.server !== undefined;
    }

    /**
     * Is server socket?
     */
    isServer = false;

    //isThisNeeded: boolean;

    server?: any;
    /**
     * Encoder manages data (de)serialization
     */
    encoder: IEncoder;
    /**
     * Timeout for RPC calls
     */
    timeout: number;

    constructor(name: string | Logger, encoder: IEncoder, server: any = null, timeout = 20000) {
        this.timeout = timeout;
        this.logger = Logger.from(name);
        if (server)
            this.server = server;
        this.encoder = encoder;
    }

    /**
     * Local defined RPC methods
     * methodId=>handler map
     */
    rpcMethods: IRPCMethodList<this> = {};
    /**
     * Local defined event handlers
     * eventId=>[...handlers] map
     */
    eventHandlers: IEventHandlerList<this> = {};

    local = {
        emit: (name: string, data: any): boolean => {
            let handled = false;
            try {
                if (this.eventHandlers[name]) {
                    handled = true;
                    for (let handler of this.eventHandlers[name]) {
                        (handler as any)(data);
                    }
                }
            } catch (e) {
                this.logger.error(`"${name}" event handler (on local) thrown error:`);
                this.logger.error(e.stack);
            }
            if (this.isManaged) {
                try {
                    if (this.server.eventHandlers[name]) {
                        handled = true;
                        for (let handler of this.server.eventHandlers[name])
                            handler(this, data);
                    }
                } catch (e) {
                    this.logger.error(`"${name}" event handler (on server) thrown error:`);
                    this.logger.error(e.stack);
                }
            }
            return handled;
        },
        on: (name: string, handler: (data: any) => PromisableVoid) => {
            // TODO: Interceptors?
            throw new Error('Cannot set event interceptor');
        },
        /**
         * GET = calls local rpc method
         * SET = does nothing
         */
        get rpc(): F {
            throw new Error('Cannot use rpc on local!');
        }
    };

    remote = {
        emit: (name: string, data: any): boolean => {
            if (!this.encoder.hasEvent(name))
                throw new Error('Trying to emit not existing packet!');
            try {
                let serialized = this.encoder.encodeData({
                    type: PacketType.EVENT,
                    name,
                    data
                });
                this.sendBufferToRemote(serialized);
            } catch (e) {
                this.logger.error(JSON.stringify(data));
                this.logger.error(`Data serialization failed for method ${name}`);
                this.logger.error(e.stack);
            }
            return true;
        },
        on: (name: string, handler: IEventHandlerWithoutThis) => {
            if (!this.encoder.hasEvent(name)) {
                throw new Error(`Trying to listen for not existing remote packet: ${name}\nExisting packets: ${this.encoder.getExistingEvents().join(', ')}`);
            }
            if (!this.eventHandlers[name])
                this.eventHandlers[name] = [handler];
            else
                this.eventHandlers[name].push(handler);
        },
        /**
         * GET = calls remote rpc method
         * SET = sets remote (Received from other client) rpc method handler
         */
        rpc: (): F => {
            let path = '';
            let self = this;
            const proxy: ProxyHandler<IRPCField<this>> = new Proxy({}, {
                get(target, key: string) {
                    path += '.' + key;
                    let callbackName = path.substr(1);
                    if (self.encoder.hasRpcMethod(callbackName)) {
                        return (...args: any[]) => {
                            path = '';
                            if (args.length !== 1)
                                throw new Error(`Wrong method call argument count: ${args.length}, methods must have only one argument passed!`);
                            return self.callRemoteMethod(callbackName, args[0]);
                        };
                    }
                    return proxy;
                },
                set(target, key: string, to: IRPCHandlerWithoutThis | IRPCHandlerWithThis<typeof self>) {
                    path += '.' + key;
                    let callbackName = path.substr(1);
                    path = '';
                    if (!self.encoder.hasRpcMethod(callbackName))
                        throw new Error(`Method declaration are not in pds: ${callbackName}\nExisting methods: ${self.encoder.getExistingRpcMethods().join(', ')}`);
                    if (!((to as any) instanceof Function))
                        throw new Error(`RPC method declaration are not a function type: ${callbackName}`);
                    if (self.isServer && to.length !== 2) {
                        throw new Error(`RPC method declaration must be (socket, data)=>{...}: ${callbackName}`);
                    } else if (!self.isServer && to.length !== 1) {
                        throw new Error(`RPC method declaration must be (data)=>{}: ${callbackName}`);
                    }
                    self.rpcMethods[callbackName] = to;
                    return true;
                }
            });
            return proxy as F;
        }
    };

    // noinspection JSUnusedGlobalSymbols
    rpc(): F {
        return this.remote.rpc();
    }

    // noinspection JSUnusedGlobalSymbols
    emit(name: string, data: any): boolean {
        return this.remote.emit(name, data);
    }

    on(name: string, handler: IRPCHandlerWithThis<this> | IRPCHandlerWithoutThis) {
        this.remote.on(name, handler as any);
    }

    /**
     * Random emulation
     */
    lastRpcMethodCallId = 0;
    /**
     * random=>[resolve,reject] map
     */
    pendingRemoteRPCCalls: { [key: number]: [(data: any) => any, (error: Error) => any] } = {};

    /**
     * Rpc call (sender side)
     * @param method method id to call
     * @param data raw data
     */
    private callRemoteMethod(method: string, data: any): Promise<any> {
        return new Promise((res, rej) => {
            // TODO: Real random (i32)
            let random = this.lastRpcMethodCallId++;
            this.encoder.setRandomToRpc(random, method);

            let serializedData: Buffer = this.encoder.encodeData({
                type: PacketType.RPC_CALL,
                random,
                data,
                name: method
            });

            let timeoutCalled = false;
            let timeoutTimeout = setTimeout(() => {
                timeoutCalled = true;
                delete this.pendingRemoteRPCCalls[random];
                rej(new RPCError('Local execution timeout'));
            }, this.timeout * 1.5);

            this.pendingRemoteRPCCalls[random] = [(d) => {
                clearTimeout(timeoutTimeout);
                res(d);
            }, (e) => {
                clearTimeout(timeoutTimeout);
                rej(e)
            }];

            this.sendBufferToRemote(serializedData);
        });
    }

    /**
     * Rpc call (receiver side)
     * @param packet
     */
    onLocalMethodCall(packet: IRPCCallPacket) {
        let random = packet.random;
        let methodName = packet.name;
        let data = packet.data;

        let rpcMethods;
        if (this.isManaged) {
            rpcMethods = this.server.rpcMethods;
        } else {
            rpcMethods = this.rpcMethods;
        }

        if (!rpcMethods[methodName]) {
            this.answerErrorOnRPCCall(random, methodName, `Server has no handlers for method ${methodName}`);
            this.logger.error(`Received not declared (via ${this.isManaged ? 'server' : 'socket'}.rpc().${methodName} = ...) method call!`);
            return;
        }

        let timeoutCalled = false;
        let timeoutTimeout = setTimeout(() => {
            this.answerErrorOnRPCCall(random, methodName, `Execution timeout for ${methodName}`);
            this.logger.error('Local method execution timeout');
            timeoutCalled = true;
        }, this.timeout);
        let methodResult;
        if (this.isManaged) {
            methodResult = (rpcMethods[methodName] as IRPCHandlerWithThis<this>)(this, data);
        } else {
            methodResult = (rpcMethods[methodName] as IRPCHandlerWithoutThis)(data);
        }
        if (!((methodResult as any) instanceof Promise)) {
            this.answerErrorOnRPCCall(random, methodName, `Server failed to construct response for ${methodName}`);
            throw new Error(`Method call ${methodName} returned not a promise!`);
        }
        methodResult.then(data => {
            if (timeoutCalled)
                return;
            clearTimeout(timeoutTimeout);
            this.answerOkOnRPCCall(random, methodName, data);
        }).catch(e => {
            if (timeoutCalled)
                return;
            clearTimeout(timeoutTimeout);
            this.logger.error(`Local method call (${methodName}) returned a error`);
            this.logger.error(e.stack);
            this.answerErrorOnRPCCall(random, methodName, e.message);
        })
    }

    /**
     * Rpc error (sender side)
     * @param random
     * @param methodName
     * @param rpcError
     */
    answerErrorOnRPCCall(random: number, methodName: string, rpcError: string) {
        try {
            let serializedData = this.encoder.encodeData({
                type: PacketType.RPC_ERROR,
                serializerName: methodName,
                random,
                data: rpcError
            });
            this.sendBufferToRemote(serializedData);
        } catch (e) {
            this.answerErrorOnRPCCall(random, methodName, `Server failed to construct ERROR response for ${methodName}`);
            this.logger.error('ERROR response serialization error:');
            this.logger.error(e.stack);
        }
    }

    /**
     * Rpc error (receiver side)
     * @param packet
     */
    onRemoteMethodError(packet: IRPCErrorPacket) {
        let random = packet.random;
        this.encoder.resetRandomToRpc(random);
        // let methodId=packet.body.eventId; // Always equals 0
        if (!this.pendingRemoteRPCCalls[random]) {
            this.logger.error('Unknown random: ' + random);
            return;
        }
        let errorText = packet.data;
        let error = new RPCError(errorText);
        this.pendingRemoteRPCCalls[random][1](error);
        delete this.pendingRemoteRPCCalls[random];
    }

    /**
     * Rpc ok (sender side)
     * @param random
     * @param methodName
     * @param data
     */
    answerOkOnRPCCall(random: number, methodName: string, data: any) {
        try {
            let serialized = this.encoder.encodeData({
                type: PacketType.RPC_OK,
                serializerName: methodName,
                random,
                data
            });
            this.sendBufferToRemote(serialized);
        } catch (e) {
            this.answerErrorOnRPCCall(random, methodName, `Server failed to construct OK response for ${methodName}`);
            this.logger.error('OK response serialization error:');
            this.logger.error(e.stack);
        }
    }

    /**
     * Rpc ok (receiver side)
     * @param packet
     */
    onRemoteMethodOk(packet: IRPCOkPacket) {
        let random = packet.random;
        this.encoder.resetRandomToRpc(random);
        let data = packet.data;
        if (!this.pendingRemoteRPCCalls[random]) {
            this.logger.error('Unknown random: ' + random);
            return;
        }
        this.pendingRemoteRPCCalls[random][0](data);
        delete this.pendingRemoteRPCCalls[random];
    }

    /**
     * Called when packet with tag: event received
     * @param packet
     */
    onRemoteEvent(packet: IEventPacket) {
        let eventName = packet.name;
        let data = packet.data;
        let handled = this.local.emit(eventName, data);
        if (!handled)
            this.logger.error(`No handlers are defined for received remote event "${eventName}"`);
    }


    /**
     * Networking.
     * Send buffer to receiver side
     * @param buffer
     */
    sendBufferToRemote(buffer: Buffer) {
        this.logger.error(buffer);
        throw new Error('PotatoSocketUniversal have no sendBufferToRemote method declaration!\nUse class extending it!');
    }

    // noinspection JSUnusedGlobalSymbols
    /**
     * Networking
     * Got buffer from sender side
     * @param buffer
     */
    gotBufferFromRemote(buffer: Buffer) {
        try {
            let packet = this.encoder.decodeData(buffer);
            switch (packet.type) {
                case PacketType.RPC_CALL:
                    this.onLocalMethodCall(packet);
                    break;
                case PacketType.RPC_ERROR:
                    this.onRemoteMethodError(packet);
                    break;
                case PacketType.RPC_OK:
                    this.onRemoteMethodOk(packet);
                    break;
                case PacketType.EVENT:
                    this.onRemoteEvent(packet);
                    break;
            }
        } catch (e) {
            this.logger.error(`Data deserialization failed for a remote packet!`);
            this.logger.error(e.stack);
        }
    }
}
