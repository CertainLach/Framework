const definedTypes = {};

function processAny (object, reverse, advancedTypes) {
	if (object instanceof Array) {
		return processArray(object, reverse);
	}
	if (!reverse && typeof object === 'number') {
		return processNumber(object, reverse);
	}
	if (typeof object === 'object' || typeof object === 'function') {
		let out = processDefined(object, reverse, advancedTypes);
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
function processArray (array, reverse) {
	let out = [];
	for (let value of array) {
		out.push(processAny(value, reverse, null));
	}
	return out;
}
function processObject (object, reverse) {
	let out = {};
	for (let key in object) {
		if (object.hasOwnProperty(key)) {
			out[key] = processAny(object[key], reverse, null);
		}
	}
	return out;
}
function processDefined (object, reverse, advancedTypes) {
	for (let typeName in advancedTypes) {
		let type = advancedTypes[typeName];
		if (reverse) {
			if (!type.testJson) throw new Error('Every type must be deserializable!');
			if (type.testJson(object)) {
				return type.deserialize(object);
			}
		} else {
			if (!type.testObj) {
				continue;
			}
			if (type.testObj(object)) {
				return type.serialize(object);
			}
		}
	}
	for (let typeName in definedTypes) {
		let type = definedTypes[typeName];
		if (reverse) {
			if (!type.testJson) throw new Error('Every type must be deserializable!');
			if (type.testJson(object)) {
				return type.deserialize(object);
			}
		} else {
			if (type.testObj && type.testObj(object)) {
				return type.serialize(object);
			}
		}
	}
	return {
		nothing: 1
	};
}
function processNumber (number, reverse) {
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
export default class AJSON {
    /**
     * Same as JSON.stringify(), but adds new argument: advancedTypes
     * @param advancedTypes custom types to serialize
     */
	static stringify (object, replacer, space = undefined, advancedTypes = {}) {
		return JSON.stringify(processAny(object, false, advancedTypes), replacer, space);
	}
    /**
     * Same as JSON.parse(), but adds new argument: advancedTypes
     * @param advancedTypes custom types to deserialize
     */
	static parse (string, reviver = undefined, advancedTypes = {}) {
		return processAny(JSON.parse(string, reviver), true, advancedTypes);
	}
    /**
     * Only deserialize, dont de-stringify
     */
	static deserialize (object, advancedTypes = {}) {
		return processAny(object, true, advancedTypes);
	}
    /**
     * Only serialize, dont stringify
     */
	static serialize (object, advancedTypes = {}) {
		return processAny(object, false, advancedTypes);
	}
    /**
     * Adds new type to parser
     * @param name must be unique
     */
	static defineType (name, typeDef) {
		if (definedTypes[name]) {
			throw new Error('Type is already defined!');
		}
		definedTypes[name] = typeDef;
	}
	static getDefindedTypes () {
		return definedTypes;
	}
}

AJSON.defineType('regexp', {
	testObj (obj) {
		return obj instanceof RegExp;
	},
	serialize (obj) {
		return {
			$regex: obj.source,
			$options: (obj.global ? 'g' : '') + (obj.ignoreCase ? 'i' : '') + (obj.multiline ? 'm' : '') + (obj.extended ? 'x' : '') + (obj.sticky ? 'y' : '')
		};
	},

	testJson (obj) {
		return !!obj.$regex;
	},
	deserialize (obj) {
		return new RegExp(obj.$regex, obj.$options);
	}
});
AJSON.defineType('date', {
	testObj (obj) {
		return obj instanceof Date;
	},
	serialize (obj) {
		return {
			$date: obj.getTime()
		};
	},

	testJson (obj) {
		return !!obj.$date;
	},
	deserialize (obj) {
		return new Date(obj.$date);
	}
});
AJSON.defineType('binary', {
	testObj (obj) {
		if (typeof Buffer === 'undefined') return;
		return obj instanceof Buffer;
	},
	serialize (obj) {
		return {
			$binary: obj.toString('base64')
		};
	},

	testJson (obj) {
		return obj.hasOwnProperty('$binary');
	},
	deserialize (obj) {
		return new Buffer(obj.$binary, 'base64');
	}
});
AJSON.defineType('InfNaN', {
	testJson (obj) {
		return '$InfNaN' in obj;
	},
	deserialize (obj) {
		if (obj.$InfNaN === 0) {
			return NaN;
		} else {
			return obj.$InfNaN / 0;
		}
	}
    // Only deserialization, serialization is monkeycoded
});
AJSON.defineType('undefined', {
	testJson (obj) {
		return obj.$undefined === true;
	},
	deserialize () {
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
