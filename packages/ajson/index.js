var definedTypes = {};
function processAny(object, reverse, advancedTypes) {
    if (object instanceof Array) {
        return processArray(object, reverse);
    }
    if (!reverse && typeof object === 'number') {
        return processNumber(object, reverse);
    }
    if (typeof object === 'object' || typeof object === 'function') {
        var out = processDefined(object, reverse, advancedTypes);
        if (out && out.nothing) {
            out = processObject(object, reverse);
        }
        return out;
    }
    if (object === undefined) {
        return {
            $undefined: true
        };
    }
    if (object === true || object === false) {
        return object;
    }
    return object.toString();
}
function processArray(array, reverse) {
    var out = [];
    for (var _i = 0, array_1 = array; _i < array_1.length; _i++) {
        var value = array_1[_i];
        out.push(processAny(value, reverse, null));
    }
    return out;
}
function processObject(object, reverse) {
    var out = {};
    for (var key in object) {
        if (object.hasOwnProperty(key)) {
            out[key] = processAny(object[key], reverse, null);
        }
    }
    return out;
}
function processDefined(object, reverse, advancedTypes) {
    for (var typeName in advancedTypes) {
        var type = advancedTypes[typeName];
        if (reverse) {
            if (!type.testJson)
                throw new Error('Every type must be deserializable!');
            if (type.testJson(object)) {
                return type.deserialize(object);
            }
        }
        else {
            if (!type.testObj) {
                continue;
            }
            if (type.testObj(object)) {
                return type.serialize(object);
            }
        }
    }
    for (var typeName in definedTypes) {
        var type = definedTypes[typeName];
        if (reverse) {
            if (!type.testJson)
                throw new Error('Every type must be deserializable!');
            if (type.testJson(object)) {
                return type.deserialize(object);
            }
        }
        else {
            if (type.testObj && type.testObj(object)) {
                return type.serialize(object);
            }
        }
    }
    return {
        nothing: 1
    };
}
function processNumber(number, reverse) {
    if (isNaN(number)) {
        return {
            $InfNaN: 0
        };
    }
    if (number === Infinity) {
        return {
            $InfNaN: 1
        };
    }
    if (number === -Infinity) {
        return {
            $InfNaN: -1
        };
    }
    return number;
}
/**
 * AJSON is a Advanced JSON.
 * = JSON with types
 * Supports some types by default
 */
var AJSON = /** @class */ (function () {
    function AJSON() {
    }
    /**
     * Same as JSON.stringify(), but adds new argument: advancedTypes
     * @param object Object to stringify
     * @param replacer Replacer function
     * @param space Spaces
     * @param advancedTypes Custom types to serialize
     */
    AJSON.stringify = function (object, replacer, space, advancedTypes) {
        if (advancedTypes === void 0) { advancedTypes = {}; }
        return JSON.stringify(processAny(object, false, advancedTypes), replacer, space);
    };
    /**
     * Same as JSON.parse(), but adds new argument: advancedTypes
     * @param string
     * @param reviver
     * @param advancedTypes
     */
    AJSON.parse = function (string, reviver, advancedTypes) {
        if (advancedTypes === void 0) { advancedTypes = {}; }
        return processAny(JSON.parse(string, reviver), true, advancedTypes);
    };
    /**
     * Only deserialize, dont de-stringify
     */
    AJSON.deserialize = function (object, advancedTypes) {
        if (advancedTypes === void 0) { advancedTypes = {}; }
        return processAny(object, true, advancedTypes);
    };
    /**
     * Only serialize, dont stringify
     */
    AJSON.serialize = function (object, advancedTypes) {
        if (advancedTypes === void 0) { advancedTypes = {}; }
        return processAny(object, false, advancedTypes);
    };
    /**
     * Adds new type to parser
     * @param name must be unique
     */
    AJSON.defineType = function (name, typeDef) {
        if (definedTypes[name]) {
            throw new Error('Type is already defined!');
        }
        definedTypes[name] = typeDef;
    };
    AJSON.getDefindedTypes = function () {
        return definedTypes;
    };
    return AJSON;
}());
export default AJSON;
AJSON.defineType('regexp', {
    testObj: function (obj) {
        return obj instanceof RegExp;
    },
    serialize: function (obj) {
        return {
            $regex: obj.source,
            $options: (obj.global ? 'g' : '') + (obj.ignoreCase ? 'i' : '') + (obj.multiline ? 'm' : '') + (obj.extended ? 'x' : '') + (obj.sticky ? 'y' : '')
        };
    },
    testJson: function (obj) {
        return !!obj.$regex;
    },
    deserialize: function (obj) {
        return new RegExp(obj.$regex, obj.$options);
    }
});
AJSON.defineType('date', {
    testObj: function (obj) {
        return obj instanceof Date;
    },
    serialize: function (obj) {
        return {
            $date: obj.getTime()
        };
    },
    testJson: function (obj) {
        return !!obj.$date;
    },
    deserialize: function (obj) {
        return new Date(obj.$date);
    }
});
AJSON.defineType('binary', {
    testObj: function (obj) {
        if (typeof Buffer === 'undefined')
            return;
        return obj instanceof Buffer;
    },
    serialize: function (obj) {
        return {
            $binary: obj.toString('base64')
        };
    },
    testJson: function (obj) {
        return obj.hasOwnProperty('$binary');
    },
    deserialize: function (obj) {
        return new Buffer(obj.$binary, 'base64');
    }
});
AJSON.defineType('InfNaN', {
    testJson: function (obj) {
        return '$InfNaN' in obj;
    },
    deserialize: function (obj) {
        if (obj.$InfNaN === 0) {
            return NaN;
        }
        else {
            return obj.$InfNaN / 0;
        }
    }
    // Only deserialization, serialization is monkeycoded
});
AJSON.defineType('undefined', {
    testJson: function (obj) {
        return obj.$undefined === true;
    },
    deserialize: function () {
        return undefined;
    }
    // Only deserialization, serialization is monkeycoded
});
// definedTypes['function'] = {
//     testObj(obj) {
//         return obj instanceof Function;
//     },
//     serialize(obj) {
//         let asString = obj.toString();
//         let isFnRegex = /^\s*(?:function)?\*/;
//         return {
//             $function: true,
//             $body: new Buffer(asString.split(')').slice(1).join(')').trim()).toString('base64'),
//             $arguments: new Buffer(asString.split('(')[1].split(')')[0].replace(/[\s\n]*/g,'')).toString('base64'),
//             $name: obj.name || '',
//             $async: asString.indexOf('async') !== -1 && asString.indexOf('async') < (asString.indexOf(obj.name) || asString.indexOf('(')),
//             $generator: isFnRegex.test(asString)
//         };
//     }
// };
//# sourceMappingURL=index.js.map