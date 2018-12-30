const definedTypes: any = {};

function processAny(object: any, reverse: boolean, advancedTypes: any): any {
	if (object instanceof Array) {
		return processArray(object, reverse);
	}
	if (!reverse && typeof (object as any) === 'number') {
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
function processArray(array: any[], reverse: boolean) {
	let out = [];
	for (let value of array) {
		out.push(processAny(value, reverse, null));
	}
	return out;
}
function processObject(object: any, reverse: boolean) {
	let out: any = {};
	for (let key in object) {
		if (object.hasOwnProperty(key)) {
			out[key] = processAny(object[key], reverse, null);
		}
	}
	return out;
}
function processDefined(object: any, reverse: boolean, advancedTypes: any) {
	for (let typeName in advancedTypes) {
		if (!advancedTypes.hasOwnProperty(typeName))
			continue;
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
		if (!definedTypes.hasOwnProperty(typeName))
			continue;
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
function processNumber(number: number, reverse: boolean) {
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
     * @param object Object to stringify
     * @param replacer Replacer function
     * @param space Spaces
     * @param advancedTypes Custom types to serialize
     */
	static stringify(object: any, replacer?: any, space?: any, advancedTypes: any = {}) {
		return JSON.stringify(processAny(object, false, advancedTypes), replacer, space);
	}

    /**
     * Same as JSON.parse(), but adds new argument: advancedTypes
     * @param string
     * @param reviver
     * @param advancedTypes
     */
	static parse(string?: string, reviver?: any, advancedTypes: any = {}) {
		return processAny(JSON.parse(string, reviver), true, advancedTypes);
	}
    /**
     * Only deserialize, dont de-stringify
     */
	static deserialize(object: any, advancedTypes: any = {}) {
		return processAny(object, true, advancedTypes);
	}
    /**
     * Only serialize, dont stringify
     */
	static serialize(object: any, advancedTypes: any = {}) {
		return processAny(object, false, advancedTypes);
	}

    /**
     * Adds new type to parser
     * @param name must be unique
     * @param typeDef type definition
     */
	static defineType(name: string, typeDef: any) {
		if (definedTypes[name]) {
			throw new Error('Type is already defined!');
		}
		definedTypes[name] = typeDef;
	}
	static get definedTypes() {
		return definedTypes;
	}
}

AJSON.defineType('regexp', {
	testObj(obj: any) {
		return obj instanceof RegExp;
	},
	serialize(obj: any) {
		return {
			$regex: obj.source,
			$options: (obj.global ? 'g' : '') + (obj.ignoreCase ? 'i' : '') + (obj.multiline ? 'm' : '') + (obj.extended ? 'x' : '') + (obj.sticky ? 'y' : '')
		};
	},

	testJson(obj: any) {
		return !!obj.$regex;
	},
	deserialize(obj: any) {
		return new RegExp(obj.$regex, obj.$options);
	}
});
AJSON.defineType('date', {
	testObj(obj: any) {
		return obj instanceof Date;
	},
	serialize(obj: any) {
		return {
			$date: obj.getTime()
		};
	},

	testJson(obj: any) {
		return !!obj.$date;
	},
	deserialize(obj: any) {
		return new Date(obj.$date);
	}
});
// TODO: ArrayBuffer
AJSON.defineType('binary', {
	testObj(obj: Buffer) {
		if (typeof Buffer === 'undefined') return false;
		return obj instanceof Buffer;
	},
	serialize(obj: Buffer) {
		return {
			$binary: obj.toString('base64')
		};
	},

	testJson(obj: any) {
		return obj.hasOwnProperty('$binary');
	},
	deserialize(obj: any) {
		return new Buffer(obj.$binary, 'base64');
	}
});
AJSON.defineType('InfNaN', {
	testJson(obj: any) {
		return '$InfNaN' in obj;
	},
	deserialize(obj: any) {
		if (obj.$InfNaN === 0) {
			return NaN;
		} else {
			return obj.$InfNaN / 0;
		}
	}
	// Only deserialization, serialization is hardcoded
});
AJSON.defineType('undefined', {
	testJson(obj: any) {
		return obj.$undefined === true;
	},
	deserialize(): any {
		return undefined;
	}
	// Only deserialization, serialization is hardcoded
});

// TODO: Allow function to be serialized
// definedTypes['function'] = {
//     testObj(obj:any) {
//         return obj instanceof Function;
//     },
//     serialize(obj:any) {
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
