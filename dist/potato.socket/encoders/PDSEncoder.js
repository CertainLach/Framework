(function (dependencies, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    }
})(["require", "exports", "../"], function (require, exports) {
    "use strict";
    var _1 = require("../");
    var PDSEncoder = (function () {
        function PDSEncoder(output) {
            this.randomToRpcId = {};
            this.rpcIdToRandom = {};
            /**
             * Declaration part
             */
            /**
             * Id's should equal on sender and receiver
             * @type {number}
             */
            this.lastRpcEventId = 0x0;
            this.lastNormalEventId = 0x0;
            /**
             * id=>[request declaration,response declaration] map
             */
            this._rpc = [];
            this._events = [];
            /**
             * event name=>id map
             */
            this.rpcToId = {};
            this.eventToId = {};
            /**
             * id=>event name map
             */
            this.idToRpc = {};
            this.idToEvent = {};
            this.processDeclaration(output);
        }
        PDSEncoder.prototype.setRandomToRpc = function (random, rpc) {
            var id = this.rpcToId[rpc];
            this.randomToRpcId[random] = id;
            this.rpcIdToRandom[id] = random;
        };
        PDSEncoder.prototype.resetRandomToRpc = function (random) {
            var id = this.randomToRpcId[random];
            delete this.randomToRpcId[random];
            delete this.rpcIdToRandom[id];
        };
        PDSEncoder.prototype.getExistingRpcMethods = function () {
            return Object.keys(this.rpcToId);
        };
        PDSEncoder.prototype.hasRpcMethod = function (name) {
            return name in this.rpcToId;
        };
        PDSEncoder.prototype.getExistingEvents = function () {
            return Object.keys(this.eventToId);
        };
        PDSEncoder.prototype.hasEvent = function (name) {
            return name in this.eventToId;
        };
        /**
         * Calculates size of resulting packet
         * @param data
         */
        PDSEncoder.prototype.sizeOf = function (data) {
            var id;
            var serializer;
            switch (data.type) {
                case _1.PacketType.RPC_CALL:
                    // Prepare
                    id = this.rpcToId[data.name];
                    serializer = this._rpc[id][0];
                    return 1 + 4 + 1 + serializer.sizeOf(data.data); // type + Random + ID + Buffer
                case _1.PacketType.RPC_OK:
                    // Prepare
                    id = this.randomToRpcId[data.random];
                    serializer = this._rpc[id][1];
                    return 1 + 4 + serializer.sizeOf(data.data); // type + Random + Buffer
                case _1.PacketType.RPC_ERROR:
                    // Prepare
                    // Do not need to do anything, since error is always a string
                    return 1 + 4 + data.data.length; // type + Random + Buffer
                case _1.PacketType.EVENT:
                    // Prepare
                    id = this.eventToId[data.name];
                    serializer = this._events[id];
                    return 1 + 1 + serializer.sizeOf(data.data); // type + ID + Buffer
            }
        };
        PDSEncoder.prototype.encodeData = function (data) {
            var length = this.sizeOf(data);
            var buffer = Buffer.allocUnsafe(length);
            buffer.writeUInt8(data.type, 0, true);
            var id;
            var serializer;
            switch (data.type) {
                case _1.PacketType.RPC_CALL:
                    // Prepare
                    id = this.rpcToId[data.name];
                    serializer = this._rpc[id][0];
                    // Write
                    buffer.writeUInt32LE(data.random, 1, true);
                    buffer.writeUInt8(id, 5, true);
                    serializer.serialize(data.data, buffer, 6);
                    return buffer;
                case _1.PacketType.RPC_OK:
                    // Prepare
                    id = this.randomToRpcId[data.random];
                    serializer = this._rpc[id][1];
                    // Write
                    buffer.writeUInt32LE(data.random, 1, true);
                    serializer.serialize(data.data, buffer, 5);
                    return buffer;
                case _1.PacketType.RPC_ERROR:
                    // Prepare
                    // Do not need to do anything, since error is always a string
                    // Write
                    buffer.writeUInt32LE(data.random, 1, true);
                    Buffer.from(data.data).copy(buffer, 5);
                    return buffer;
                case _1.PacketType.EVENT:
                    // Prepare
                    id = this.eventToId[data.name];
                    serializer = this._events[id];
                    // Write
                    buffer.writeUInt8(id, 1, true);
                    serializer.serialize(data.data, buffer, 2);
                    return buffer;
            }
        };
        PDSEncoder.prototype.decodeData = function (buffer) {
            var type = buffer.readUInt8(0, true);
            var id;
            var serializer;
            var random;
            var data;
            var name;
            switch (type) {
                case _1.PacketType.RPC_CALL:
                    random = buffer.readUInt32LE(1, true);
                    id = buffer.readUInt8(5, true);
                    serializer = this._rpc[id][0];
                    name = this.idToRpc[id];
                    data = serializer.deserialize(buffer, 6);
                    return {
                        type: type,
                        name: name,
                        data: data,
                        random: random
                    };
                case _1.PacketType.RPC_OK:
                    random = buffer.readUInt32LE(1, true);
                    id = this.randomToRpcId[data.random];
                    serializer = this._rpc[id][1];
                    data = serializer.deserialize(buffer, 5);
                    return {
                        type: type,
                        data: data,
                        random: random
                    };
                case _1.PacketType.RPC_ERROR:
                    random = buffer.readUInt32LE(1, true);
                    data = buffer.slice(5).toString();
                    return {
                        type: type,
                        data: data,
                        random: random
                    };
                case _1.PacketType.EVENT:
                    id = buffer.readUInt8(1, true);
                    name = this.idToEvent[id];
                    serializer = this._events[id];
                    data = serializer.deserialize(buffer, 2);
                    return {
                        type: type,
                        name: name,
                        data: data
                    };
            }
        };
        /**
         * Helpers
         */
        /**
         * Serialize via protodef
         * @param data data to serialize
         * @param declaration serializer
         */
        PDSEncoder.prototype.serializeByDeclaration = function (data, declaration) {
            var length = declaration.sizeOf(data);
            var buffer = Buffer.allocUnsafe(length);
            declaration.serialize(data, buffer, 0);
            return buffer;
        };
        /**
         * Deserialize via protodef
         * @param buffer data to deserialize
         * @param declaration deserializer
         */
        PDSEncoder.prototype.deserializeByDeclaration = function (buffer, declaration) {
            return declaration.deserialize(buffer, 0)[0];
        };
        /**
         * Add event (used in initialization stage)
         * @param event
         * @param declaration
         */
        PDSEncoder.prototype.processAddNormalEvent = function (event, declaration) {
            var id = this.lastNormalEventId++;
            this.eventToId[event] = id;
            this.idToEvent[id] = event;
            this._events[id] = declaration;
        };
        /**
         * Add RPC method (used in initialization stage)
         * @param eventPath
         * @param request
         * @param response
         */
        PDSEncoder.prototype.processAddRpcMethod = function (eventPath, request, response) {
            var id = this.lastRpcEventId++;
            this.rpcToId[eventPath] = id;
            this.idToRpc[id] = eventPath;
            this._rpc[id] = [request, response];
        };
        /**
         * Add events/methods (used in initialization stage)
         * @param declaration declaration to process
         */
        PDSEncoder.prototype.processDeclaration = function (declaration) {
            var keys = Object.keys(declaration).sort();
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                var key = keys_1[_i];
                if (!declaration.hasOwnProperty(key))
                    continue;
                var lastParts = key.split('::');
                var lastPart = lastParts[lastParts.length - 1];
                if (lastPart !== 'request' && lastPart !== 'response') {
                    var path = key.split('::');
                    if (path[0] === '')
                        path = path.slice(1);
                    this.processAddNormalEvent(path.join('.'), declaration[key]);
                }
                else {
                    var path = key.split('::').slice(0, -1);
                    if (path[0] === '')
                        path = path.slice(1);
                    var prefix = key.slice(0, key.lastIndexOf('::'));
                    if (this.rpcToId[path.join('.')])
                        continue;
                    var requestDeclaration = declaration[prefix + '::request'];
                    var responseDeclaration = declaration[prefix + '::response'];
                    if (!requestDeclaration)
                        throw new Error("Rpc call " + prefix + " has no request declaration!");
                    if (!responseDeclaration)
                        throw new Error("Rpc call " + prefix + " has no response declaration!");
                    this.processAddRpcMethod(path.join('.'), requestDeclaration, responseDeclaration);
                }
            }
        };
        return PDSEncoder;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = PDSEncoder;
});
//# sourceMappingURL=PDSEncoder.js.map