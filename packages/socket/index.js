var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import Logger from '@meteor-it/logger';
/**
 * Websocket wrapper with auto-reconnection
 */
var WebSocketClient = /** @class */ (function () {
    function WebSocketClient(url, reconnectInterval) {
        if (reconnectInterval === void 0) { reconnectInterval = 100; }
        this.number = 0; // Message id
        this.safeClose = false;
        this.sendBuffer = [];
        this.autoReconnectInterval = reconnectInterval; // ms
        this.url = url;
    }
    /**
     * Opens connection
     */
    WebSocketClient.prototype.open = function () {
        var _this = this;
        this.safeClose = false;
        this.instance = new WebSocket(this.url);
        this.instance.binaryType = 'arraybuffer';
        this.instance.onopen = function () {
            _this.onOpenResend();
            _this.onopen();
        };
        this.instance.onmessage = function (data, flags) {
            _this.number++;
            _this.onmessage(data, flags, _this.number);
        };
        this.instance.onclose = function (e) {
            if (!_this.safeClose) {
                switch (e) {
                    case 1000:// CLOSE_NORMAL
                        _this.onclose(e);
                        break;
                    default:// Abnormal closure
                        _this.reconnect();
                        break;
                }
            }
            else {
                _this.onclose(e);
            }
        };
        this.instance.onerror = function (e) {
            switch (e.code) {
                case 'ECONNREFUSED':
                    if (!_this.safeClose)
                        _this.reconnect();
                    else
                        _this.onclose(e);
                    break;
                default:
                    _this.onerror(e);
                    break;
            }
        };
    };
    /**
     * Closes connection
     */
    WebSocketClient.prototype.close = function () {
        this.safeClose = true;
        this.instance.close();
    };
    /**
     * Sends data to remote socket or saves to buffer if not available
     * @param data
     * @param option
     */
    WebSocketClient.prototype.send = function (data, option) {
        try {
            this.instance.send(data, option);
        }
        catch (e) {
            this.sendBuffer.push([data, option]);
        }
    };
    /**
     * Reconnects to a websocket
     */
    WebSocketClient.prototype.reconnect = function () {
        var _this = this;
        if (!this.safeClose) {
            setTimeout(function () {
                _this.open();
            }, this.autoReconnectInterval);
        }
    };
    /**
     * After successful reconnection send all buffered data to remote
     */
    WebSocketClient.prototype.onOpenResend = function () {
        for (var _i = 0, _a = this.sendBuffer; _i < _a.length; _i++) {
            var _b = _a[_i], data = _b[0], option = _b[1];
            this.send(data, option);
        }
        this.sendBuffer = [];
    };
    WebSocketClient.prototype.onopen = function () {
    };
    WebSocketClient.prototype.onmessage = function (data, flags, number) {
    };
    WebSocketClient.prototype.onerror = function (e) {
    };
    WebSocketClient.prototype.onclose = function (e) {
    };
    return WebSocketClient;
}());
export { WebSocketClient };
var RPCError = /** @class */ (function (_super) {
    __extends(RPCError, _super);
    function RPCError(message) {
        return _super.call(this, message.toString()) || this;
    }
    return RPCError;
}(Error));
export { RPCError };
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
export var IS_RPC = 128;
export var IS_RES = 64;
export var IS_OK = 32;
export var IS_MULT_OF_2 = 16;
export var IS_TEST = 8;
export var IS_PING = 4;
export var IS_AOK = 2;
export var IS_DOK = 1;
export var PacketType;
(function (PacketType) {
    PacketType[PacketType["RPC_CALL"] = 130] = "RPC_CALL";
    PacketType[PacketType["RPC_ERROR"] = 194] = "RPC_ERROR";
    PacketType[PacketType["RPC_OK"] = 226] = "RPC_OK";
    PacketType[PacketType["EVENT"] = 98] = "EVENT";
})(PacketType || (PacketType = {}));
;
;
;
;
/**
 * Common potato.socket implementation
 * Universal side (Use any protocol)
 */
var PotatoSocketUniversal = /** @class */ (function () {
    function PotatoSocketUniversal(name, encoder, server, timeout) {
        if (server === void 0) { server = null; }
        if (timeout === void 0) { timeout = 20000; }
        var _this = this;
        /**
         * Is server socket?
         */
        this.isServer = false;
        /**
         * Local defined RPC methods
         * methodId=>handler map
         */
        this.rpcMethods = {};
        /**
         * Local defined event handlers
         * eventId=>[...handlers] map
         */
        this.eventHandlers = {};
        this.local = {
            emit: function (name, data) {
                var handled = false;
                try {
                    if (_this.eventHandlers[name]) {
                        handled = true;
                        console.log(_this.eventHandlers);
                        for (var _i = 0, _a = _this.eventHandlers[name]; _i < _a.length; _i++) {
                            var handler = _a[_i];
                            handler(data);
                        }
                    }
                }
                catch (e) {
                    _this.logger.error("\"" + name + "\" event handler (on local) thrown error:");
                    _this.logger.error(e.stack);
                }
                if (_this.isManaged) {
                    try {
                        if (_this.server.eventHandlers[name]) {
                            handled = true;
                            for (var _b = 0, _c = _this.server.eventHandlers; _b < _c.length; _b++) {
                                var handler = _c[_b];
                                handler(_this, data);
                            }
                        }
                    }
                    catch (e) {
                        _this.logger.error("\"" + name + "\" event handler (on server) thrown error:");
                        _this.logger.error(e.stack);
                    }
                }
                return handled;
            },
            on: function (name, handler) {
                // TODO: Interceptors?
                throw new Error('Cannot set event interceptor');
            },
            /**
             * GET = calls local rpc method
             * SET = does nothing
             */
            get rpc() {
                throw new Error('Cannot use rpc on local!');
            }
        };
        this.remote = {
            emit: function (name, data) {
                if (!_this.encoder.hasEvent(name))
                    throw new Error('Trying to emit not existing packet!');
                try {
                    var serialized = _this.encoder.encodeData({
                        type: PacketType.EVENT,
                        name: name,
                        data: data
                    });
                    _this.sendBufferToRemote(serialized);
                }
                catch (e) {
                    _this.logger.error(JSON.stringify(data));
                    _this.logger.error("Data serialization failed for method " + name);
                    _this.logger.error(e.stack);
                }
                return true;
            },
            on: function (name, handler) {
                if (!_this.encoder.hasEvent(name)) {
                    throw new Error("Trying to listen for not existing remote packet: " + name + "\nExisting packets: " + _this.encoder.getExistingEvents().join(', '));
                }
                if (!_this.eventHandlers[name])
                    _this.eventHandlers[name] = [handler];
                else
                    _this.eventHandlers[name].push(handler);
            },
            /**
             * GET = calls remote rpc method
             * SET = sets remote (Received from other client) rpc method handler
             */
            rpc: function () {
                var path = '';
                var proxy = new Proxy({}, {
                    get: function (target, key) {
                        var _this = this;
                        path += '.' + key;
                        var callbackName = path.substr(1);
                        if (this.encoder.hasRpcMethod(callbackName)) {
                            return function () {
                                var args = [];
                                for (var _i = 0; _i < arguments.length; _i++) {
                                    args[_i] = arguments[_i];
                                }
                                path = '';
                                if (args.length !== 1)
                                    throw new Error("Wrong method call argument count: " + args.length + ", methods must have only one argument passed!");
                                return _this.callRemoteMethod(callbackName, args[0]);
                            };
                        }
                        return proxy;
                    },
                    set: function (target, key, to) {
                        path += '.' + key;
                        var callbackName = path.substr(1);
                        path = '';
                        if (!this.encoder.hasRpcMethod(callbackName))
                            throw new Error("Method declaration are not in pds: " + callbackName + "\nExisting methods: " + this.encoder.getExistingRpcMethods().join(', '));
                        if (!(to instanceof Function))
                            throw new Error("RPC method declaration are not a function type: " + callbackName);
                        if (this.isServer && to.length !== 2) {
                            throw new Error("RPC method declaration must be (socket, data)=>{...}: " + callbackName);
                        }
                        else if (!this.isServer && to.length !== 1) {
                            throw new Error("RPC method declaration must be (data)=>{}: " + callbackName);
                        }
                        this.rpcMethods[callbackName] = to;
                        return true;
                    }
                });
                return proxy;
            }
        };
        /**
         * Random emulation
         */
        this.lastRpcMethodCallId = 0;
        /**
         * random=>[resolve,reject] map
         */
        this.pendingRemoteRPCCalls = {};
        this.timeout = timeout;
        if (name instanceof Logger) {
            this.logger = name;
        }
        else {
            this.logger = new Logger(name);
        }
        if (server)
            this.server = server;
        this.encoder = encoder;
    }
    Object.defineProperty(PotatoSocketUniversal.prototype, "isManaged", {
        /**
         * Is socket managed by something?
         * If true - pass 'this' to event/rpc handlers
         */
        get: function () {
            return this.server !== undefined;
        },
        enumerable: true,
        configurable: true
    });
    PotatoSocketUniversal.prototype.rpc = function () {
        return this.remote.rpc();
    };
    PotatoSocketUniversal.prototype.emit = function (name, data) {
        return this.remote.emit(name, data);
    };
    PotatoSocketUniversal.prototype.on = function (name, handler) {
        this.remote.on(name, handler);
    };
    /**
     * Rpc call (sender side)
     * @param method method id to call
     * @param data raw data
     */
    PotatoSocketUniversal.prototype.callRemoteMethod = function (method, data) {
        var _this = this;
        return new Promise(function (res, rej) {
            // TODO: Real random (i32)
            var random = _this.lastRpcMethodCallId++;
            _this.encoder.setRandomToRpc(random, method);
            var serializedData = _this.encoder.encodeData({
                type: PacketType.RPC_CALL,
                random: random,
                data: data,
                name: method
            });
            var timeoutCalled = false;
            var timeoutTimeout = setTimeout(function () {
                timeoutCalled = true;
                delete _this.pendingRemoteRPCCalls[random];
                rej(new RPCError('Local execution timeout'));
            }, _this.timeout * 1.5);
            _this.pendingRemoteRPCCalls[random] = [function (d) {
                    clearTimeout(timeoutTimeout);
                    res(d);
                }, function (e) {
                    clearTimeout(timeoutTimeout);
                    rej(e);
                }];
            _this.sendBufferToRemote(serializedData);
        });
    };
    /**
     * Rpc call (receiver side)
     * @param packet
     */
    PotatoSocketUniversal.prototype.onLocalMethodCall = function (packet) {
        var _this = this;
        var random = packet.random;
        var methodName = packet.name;
        var data = packet.data;
        var rpcMethods;
        if (this.isManaged) {
            rpcMethods = this.server.rpcMethods;
        }
        else {
            rpcMethods = this.rpcMethods;
        }
        if (!rpcMethods[methodName]) {
            this.answerErrorOnRPCCall(random, methodName, "Server has no handlers for method " + methodName);
            this.logger.error("Received not declared (via " + (this.isManaged ? 'server' : 'socket') + ".rpc()." + methodName + " = ...) method call!");
            return;
        }
        var timeoutCalled = false;
        var timeoutTimeout = setTimeout(function () {
            _this.answerErrorOnRPCCall(random, methodName, "Execution timeout for " + methodName);
            _this.logger.error('Local method execution timeout');
            timeoutCalled = true;
        }, this.timeout);
        var methodResult;
        if (this.isManaged) {
            methodResult = rpcMethods[methodName](this, data);
        }
        else {
            methodResult = rpcMethods[methodName](data);
        }
        if (!(methodResult instanceof Promise)) {
            this.answerErrorOnRPCCall(random, methodName, "Server failed to construct response for " + methodName);
            throw new Error("Method call " + methodName + " returned not a promise!");
        }
        methodResult.then(function (data) {
            if (timeoutCalled)
                return;
            clearTimeout(timeoutTimeout);
            _this.answerOkOnRPCCall(random, methodName, data);
        }).catch(function (e) {
            if (timeoutCalled)
                return;
            clearTimeout(timeoutTimeout);
            _this.logger.error("Local method call (" + methodName + ") returned a error");
            _this.logger.error(e.stack);
            _this.answerErrorOnRPCCall(random, methodName, e.message);
        });
    };
    /**
     * Rpc error (sender side)
     * @param random
     * @param rpcError
     */
    PotatoSocketUniversal.prototype.answerErrorOnRPCCall = function (random, methodName, rpcError) {
        try {
            var serializedData = this.encoder.encodeData({
                type: PacketType.RPC_ERROR,
                serializerName: methodName,
                random: random,
                data: rpcError
            });
            this.sendBufferToRemote(serializedData);
        }
        catch (e) {
            this.answerErrorOnRPCCall(random, methodName, "Server failed to construct ERROR response for " + methodName);
            this.logger.error('ERROR response serialization error:');
            this.logger.error(e.stack);
        }
    };
    /**
     * Rpc error (receiver side)
     * @param packet
     */
    PotatoSocketUniversal.prototype.onRemoteMethodError = function (packet) {
        var random = packet.random;
        this.encoder.resetRandomToRpc(random);
        // let methodId=packet.body.eventId; // Always equals 0
        if (!this.pendingRemoteRPCCalls[random]) {
            this.logger.error('Unknown random: ' + random);
            return;
        }
        var errorText = packet.data;
        var error = new RPCError(errorText);
        this.pendingRemoteRPCCalls[random][1](error);
        delete this.pendingRemoteRPCCalls[random];
    };
    /**
     * Rpc ok (sender side)
     * @param random
     * @param data
     */
    PotatoSocketUniversal.prototype.answerOkOnRPCCall = function (random, methodName, data) {
        try {
            var serialized = this.encoder.encodeData({
                type: PacketType.RPC_OK,
                serializerName: methodName,
                random: random,
                data: data
            });
            this.sendBufferToRemote(serialized);
        }
        catch (e) {
            this.answerErrorOnRPCCall(random, methodName, "Server failed to construct OK response for " + methodName);
            this.logger.error('OK response serialization error:');
            this.logger.error(e.stack);
        }
    };
    /**
     * Rpc ok (receiver side)
     * @param packet
     */
    PotatoSocketUniversal.prototype.onRemoteMethodOk = function (packet) {
        var random = packet.random;
        this.encoder.resetRandomToRpc(random);
        var data = packet.data;
        if (!this.pendingRemoteRPCCalls[random]) {
            this.logger.error('Unknown random: ' + random);
            return;
        }
        this.pendingRemoteRPCCalls[random][0](data);
        delete this.pendingRemoteRPCCalls[random];
    };
    /**
     * Called when packet with tag: event received
     * @param packet
     */
    PotatoSocketUniversal.prototype.onRemoteEvent = function (packet) {
        var eventName = packet.name;
        var data = packet.data;
        var handled = this.local.emit(eventName, data);
        if (!handled)
            this.logger.error("No handlers are defined for received remote event \"" + eventName + "\"");
    };
    /**
     * Networking.
     * Send buffer to receiver side
     * @param buffer
     */
    PotatoSocketUniversal.prototype.sendBufferToRemote = function (buffer) {
        console.error(buffer);
        throw new Error('PotatoSocketUniversal have no sendBufferToRemote method declaration!\nUse class extending it!');
    };
    /**
     * Networking
     * Got buffer from sender side
     * @param buffer
     */
    PotatoSocketUniversal.prototype.gotBufferFromRemote = function (buffer) {
        try {
            var packet = this.encoder.decodeData(buffer);
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
            this.logger.error("Data deserialization failed for a remote packet!");
            this.logger.error(e.stack);
        }
    };
    return PotatoSocketUniversal;
}());
export { PotatoSocketUniversal };
//# sourceMappingURL=index.js.map