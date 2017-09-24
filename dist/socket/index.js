"use strict";
const logger_1 = require("@meteor-it/logger");
const proxy_deep_1 = require("proxy-deep");
class WebSocketClient {
    constructor(url, reconnectInterval = 100) {
        this.number = 0;
        this.safeClose = false;
        this.sendBuffer = [];
        this.autoReconnectInterval = reconnectInterval;
        this.url = url;
    }
    open() {
        this.safeClose = false;
        this.instance = new WebSocket(this.url);
        this.instance.binaryType = 'arraybuffer';
        this.instance.onopen = () => {
            this.onOpenResend();
            this.onopen();
        };
        this.instance.onmessage = (data, flags) => {
            this.number++;
            this.onmessage(data, flags, this.number);
        };
        this.instance.onclose = (e) => {
            if (!this.safeClose) {
                switch (e) {
                    case 1000:
                        this.onclose(e);
                        break;
                    default:
                        this.reconnect();
                        break;
                }
            }
            else {
                this.onclose(e);
            }
        };
        this.instance.onerror = (e) => {
            switch (e.code) {
                case 'ECONNREFUSED':
                    if (!this.safeClose)
                        this.reconnect();
                    else
                        this.onclose(e);
                    break;
                default:
                    this.onerror(e);
                    break;
            }
        };
    }
    close() {
        this.safeClose = true;
        this.instance.close();
    }
    send(data, option) {
        try {
            this.instance.send(data, option);
        }
        catch (e) {
            this.sendBuffer.push([data, option]);
        }
    }
    reconnect() {
        if (!this.safeClose) {
            setTimeout(() => {
                this.open();
            }, this.autoReconnectInterval);
        }
    }
    onOpenResend() {
        for (let [data, option] of this.sendBuffer)
            this.send(data, option);
        this.sendBuffer = [];
    }
    onopen() {
    }
    onmessage(data, flags, number) {
    }
    onerror(e) {
    }
    onclose(e) {
    }
}
exports.WebSocketClient = WebSocketClient;
class RPCError extends Error {
    constructor(message) {
        super(message.toString());
    }
}
exports.RPCError = RPCError;
exports.IS_RPC = 0b10000000;
exports.IS_RES = 0b01000000;
exports.IS_OK = 0b00100000;
exports.IS_MULT_OF_2 = 0b00010000;
exports.IS_TEST = 0b00001000;
exports.IS_PING = 0b00000100;
exports.IS_AOK = 0b00000010;
exports.IS_DOK = 0b00000001;
var PacketType;
(function (PacketType) {
    PacketType[PacketType["RPC_CALL"] = 130] = "RPC_CALL";
    PacketType[PacketType["RPC_ERROR"] = 194] = "RPC_ERROR";
    PacketType[PacketType["RPC_OK"] = 226] = "RPC_OK";
    PacketType[PacketType["EVENT"] = 98] = "EVENT";
})(PacketType = exports.PacketType || (exports.PacketType = {}));
;
;
;
;
class PotatoSocketUniversal {
    constructor(name, encoder, server = null, timeout = 20000) {
        this.isServer = false;
        this.rpcMethods = {};
        this.eventHandlers = {};
        this.local = {
            emit: (name, data) => {
                let handled = false;
                try {
                    if (this.eventHandlers[name]) {
                        handled = true;
                        console.log(this.eventHandlers);
                        for (let handler of this.eventHandlers[name]) {
                            handler(data);
                        }
                    }
                }
                catch (e) {
                    this.logger.error(`"${name}" event handler (on local) thrown error:`);
                    this.logger.error(e.stack);
                }
                if (this.isManaged) {
                    try {
                        if (this.server.eventHandlers[name]) {
                            handled = true;
                            for (let handler of this.server.eventHandlers)
                                handler(this, data);
                        }
                    }
                    catch (e) {
                        this.logger.error(`"${name}" event handler (on server) thrown error:`);
                        this.logger.error(e.stack);
                    }
                }
                return handled;
            },
            on: (name, handler) => {
                throw new Error('Cannot set event interceptor');
            },
            get rpc() {
                return proxy_deep_1.default({}, {
                    get: () => {
                        throw new Error('Cannot get local rpc method!');
                    },
                    set: () => {
                        throw new Error('Cannot set remote rpc method!');
                    }
                });
            }
        };
        this.remote = {
            emit: (name, data) => {
                if (!this.encoder.hasEvent(name))
                    throw new Error('Trying to emit not existing packet!');
                try {
                    let serialized = this.encoder.encodeData({
                        type: PacketType.EVENT,
                        name,
                        data
                    });
                    this.sendBufferToRemote(serialized);
                }
                catch (e) {
                    this.logger.error(JSON.stringify(data));
                    this.logger.error(`Data serialization failed for method ${name}`);
                    this.logger.error(e.stack);
                }
                return true;
            },
            on: (name, handler) => {
                if (!this.encoder.hasEvent(name)) {
                    throw new Error(`Trying to listen for not existing remote packet: ${name}\nExisting packets: ${this.encoder.getExistingEvents().join(', ')}`);
                }
                if (!this.eventHandlers[name])
                    this.eventHandlers[name] = [handler];
                else
                    this.eventHandlers[name].push(handler);
            },
            rpc: () => {
                return proxy_deep_1.default({}, {
                    get: (target, path, receiver, nest) => {
                        let name = path.join('.');
                        if (!this.encoder.hasRpcMethod(name))
                            return nest();
                        return (...args) => {
                            if (args.length !== 1)
                                throw new Error(`Wrong method call argument count: ${args.length}, methods must have only one argument passed!`);
                            return this.callRemoteMethod(name, args[0]);
                        };
                    },
                    set: (target, path, value) => {
                        let methodName = path.join('.');
                        if (!this.encoder.hasRpcMethod(methodName))
                            throw new Error(`Method declaration are not in pds: ${methodName}\nExisting methods: ${this.encoder.getExistingRpcMethods().join(', ')}`);
                        if (!(value instanceof Function))
                            throw new Error(`RPC method declaration are not a function type: ${methodName}`);
                        console.log(this.isServer, value.length);
                        if (this.isServer && value.length !== 2) {
                            throw new Error(`RPC method declaration must be (socket, data)=>{...}: ${methodName}`);
                        }
                        else if (!this.isServer && value.length !== 1) {
                            throw new Error(`RPC method declaration must be (data)=>{}: ${methodName}`);
                        }
                        this.rpcMethods[methodName] = value;
                        return true;
                    }
                });
            }
        };
        this.lastRpcMethodCallId = 0;
        this.pendingRemoteRPCCalls = {};
        this.timeout = timeout;
        if (name instanceof logger_1.default) {
            this.logger = name;
        }
        else {
            this.logger = new logger_1.default(name);
        }
        if (server)
            this.server = server;
        this.encoder = encoder;
    }
    get isManaged() {
        return this.server !== undefined;
    }
    rpc() {
        return this.remote.rpc();
    }
    emit(name, data) {
        return this.remote.emit(name, data);
    }
    on(name, handler) {
        this.remote.on(name, handler);
    }
    callRemoteMethod(method, data) {
        return new Promise((res, rej) => {
            let random = this.lastRpcMethodCallId++;
            this.encoder.setRandomToRpc(random, method);
            let serializedData = this.encoder.encodeData({
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
                    rej(e);
                }];
            this.sendBufferToRemote(serializedData);
        });
    }
    onLocalMethodCall(packet) {
        let random = packet.random;
        let methodName = packet.name;
        let data = packet.data;
        let rpcMethods;
        if (this.isManaged) {
            rpcMethods = this.server.rpcMethods;
        }
        else {
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
            methodResult = rpcMethods[methodName](this, data);
        }
        else {
            methodResult = rpcMethods[methodName](data);
        }
        if (!(methodResult instanceof Promise)) {
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
        });
    }
    answerErrorOnRPCCall(random, methodName, rpcError) {
        try {
            let serializedData = this.encoder.encodeData({
                type: PacketType.RPC_ERROR,
                serializerName: methodName,
                random,
                data: rpcError
            });
            this.sendBufferToRemote(serializedData);
        }
        catch (e) {
            this.answerErrorOnRPCCall(random, methodName, `Server failed to construct ERROR response for ${methodName}`);
            this.logger.error('ERROR response serialization error:');
            this.logger.error(e.stack);
        }
    }
    onRemoteMethodError(packet) {
        let random = packet.random;
        this.encoder.resetRandomToRpc(random);
        if (!this.pendingRemoteRPCCalls[random]) {
            this.logger.error('Unknown random: ' + random);
            return;
        }
        let errorText = packet.data;
        let error = new RPCError(errorText);
        this.pendingRemoteRPCCalls[random][1](error);
        delete this.pendingRemoteRPCCalls[random];
    }
    answerOkOnRPCCall(random, methodName, data) {
        try {
            let serialized = this.encoder.encodeData({
                type: PacketType.RPC_OK,
                serializerName: methodName,
                random,
                data
            });
            this.sendBufferToRemote(serialized);
        }
        catch (e) {
            this.answerErrorOnRPCCall(random, methodName, `Server failed to construct OK response for ${methodName}`);
            this.logger.error('OK response serialization error:');
            this.logger.error(e.stack);
        }
    }
    onRemoteMethodOk(packet) {
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
    onRemoteEvent(packet) {
        let eventName = packet.name;
        let data = packet.data;
        let handled = this.local.emit(eventName, data);
        if (!handled)
            this.logger.error(`No handlers are defined for received remote event "${eventName}"`);
    }
    sendBufferToRemote(buffer) {
        console.error(buffer);
        throw new Error('PotatoSocketUniversal have no sendBufferToRemote method declaration!\nUse class extending it!');
    }
    gotBufferFromRemote(buffer) {
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
        }
        catch (e) {
            this.logger.error(`Data deserialization failed for a remote packet!`);
            this.logger.error(e.stack);
        }
    }
}
exports.PotatoSocketUniversal = PotatoSocketUniversal;
//# sourceMappingURL=index.js.map