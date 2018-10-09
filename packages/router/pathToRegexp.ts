const DEFAULT_DELIMITER = '/';
const ESCAPED_DEFAULT_DELIMITER = escapeString(DEFAULT_DELIMITER);
const DEFAULT_DELIMITERS = './';

const PATH_REGEXP = new RegExp('(\\\\.)|(?::(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?', 'g');

export interface Options {
    sensitive?: boolean;
    strict?: boolean;
    end?: boolean;
    endsWith?: string | string[];
}
export interface IKey {
    name: string | number;
    prefix: string;
    delimiter: string;
    optional: boolean;
    repeat: boolean;
    pattern: string;
    partial: boolean;
}
export class Key implements IKey{
    constructor(data:IKey){
        Object.assign(this,data);
    }

    delimiter: string;
    name: string | number;
    optional: boolean;
    partial: boolean;
    pattern: string;
    prefix: string;
    repeat: boolean;
}
export type Token = string | Key;
export type Path = string | RegExp | Array<string | RegExp>;
export type PathFunction = (data?: Object) => string;

function parse (str:string):Token[] {
    const tokens = [];
    let key = 0;
    let index = 0;
    let path = '';
    let pathEscaped = false;
    let res;

    while ((res = PATH_REGEXP.exec(str)) !== null) {
        const m = res[0];
        const escaped = res[1];
        const offset = res.index;
        path += str.slice(index, offset);
        index = offset + m.length;

        // Ignore already escaped sequences.
        if (escaped) {
            path += escaped[1];
            pathEscaped = true;
            continue
        }

        let prev = '';
        const next = str[index];
        const name = res[2];
        const capture = res[3];
        const group = res[4];
        const modifier = res[5];

        if (!pathEscaped && path.length) {
            const k = path.length - 1;

            if (DEFAULT_DELIMITERS.indexOf(path[k]) > -1) {
                prev = path[k];
                path = path.slice(0, k)
            }
        }

        // Push the current path onto the tokens.
        if (path) {
            tokens.push(path);
            path = '';
            pathEscaped = false
        }

        const partial = prev !== '' && next !== undefined && next !== prev;
        const repeat = modifier === '+' || modifier === '*';
        const optional = modifier === '?' || modifier === '*';
        const delimiter = prev || DEFAULT_DELIMITER;
        const pattern = capture || group;

        tokens.push({
            name: name || key++,
            prefix: prev,
            delimiter: delimiter,
            optional: optional,
            repeat: repeat,
            partial: partial,
            pattern: pattern ? escapeGroup(pattern) : `[^${escapeString(delimiter)}]+?`
        })
    }

    // Push any remaining characters.
    if (path || index < str.length) {
        tokens.push(path + str.substr(index))
    }

    return tokens
}
function compile (str:string):PathFunction {
    return tokensToFunction(parse(str))
}
function tokensToFunction (tokens:Token[]):PathFunction {
    // Compile all the tokens into regexps.
    const matches = new Array(tokens.length);

    // Compile all the patterns before compilation.
    for (let i = 0; i < tokens.length; i++) {
        if (tokens[i] instanceof Key) {
            matches[i] = new RegExp(`^(?:${(tokens[i] as Key).pattern})$`)
        }
    }

    return function (data:string) {
        let path = '';

        for (let i = 0; i < tokens.length; i++) {
            let token = tokens[i];

            if (typeof token === 'string') {
                path += token;
                continue;
            }
            token = token as Key;

            let value:any = data ? data[token.name as number] : undefined;
            let segment;

            if (Array.isArray(value)) {
                if (!token.repeat) {
                    throw new TypeError(`Expected "${token.name}" to not repeat, but got array`)
                }

                if (value.length === 0) {
                    if (token.optional) continue;

                    throw new TypeError(`Expected "${token.name}" to not be empty`)
                }

                for (let j = 0; j < value.length; j++) {
                    segment = encodeURIComponent(value[j]);

                    if (!matches[i].test(segment)) {
                        throw new TypeError(`Expected all "${token.name}" to match "${token.pattern}"`)
                    }

                    path += (j === 0 ? token.prefix : token.delimiter) + segment
                }

                continue
            }

            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                segment = encodeURIComponent(String(value));
                if (!matches[i].test(segment))
                    throw new TypeError(`Expected "${token.name}" to match "${token.pattern}", but got "${segment}"`);
                path += token.prefix + segment;
                continue
            }

            if (token.optional) {
                if (token.partial) path += token.prefix;
                continue
            }

            throw new TypeError(`Expected "${token.name}" to be ${token.repeat ? 'an array' : 'a string'}`)
        }

        return path
    }
}
function escapeString (str:string) {
    return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1')
}
function escapeGroup (group:string) {
    return group.replace(/([=!:$/()])/g, '\\$1')
}
function flags (options:Options) {
    return options && options.sensitive ? '' : 'i'
}
function regexpToRegexp (path:RegExp, keys:Key[]) {
    if (!keys) return path;

    // Use a negative lookahead to match only capturing groups.
    const groups = path.source.match(/\((?!\?)/g);

    if (groups) {
        for (let i = 0; i < groups.length; i++) {
            keys.push(new Key({
                name: i,
                prefix: null,
                delimiter: null,
                optional: false,
                repeat: false,
                partial: false,
                pattern: null
            }));
        }
    }

    return path
}
function arrayToRegexp (path:Path[], keys:Key[], options:Options) {
    const parts = [];

    for (let i = 0; i < path.length; i++) {
        parts.push(pathToRegexp(path[i], keys, options).source)
    }

    return new RegExp(`(?:${parts.join('|')})`, flags(options))
}
function stringToRegexp (path:string, keys:Key[], options:Options) {
    return tokensToRegExp(parse(path), keys, options)
}
function tokensToRegExp (tokens:Token[], keys?:Key[], options:Options={}) {
    let strict = options.strict;
    const end = options.end !== false;
    const endsWith = [].concat(options.endsWith || []).map(escapeString).concat('$').join('|');
    let route = '';
    let isEndDelimited = false;

    for (let i = 0; i < tokens.length; i++) {
        let token = tokens[i];

        if (typeof token === 'string') {
            route += escapeString(token);
            isEndDelimited = i === tokens.length - 1 && DEFAULT_DELIMITERS.indexOf(token[token.length - 1]) > -1
        } else {
            const prefix = escapeString(token.prefix);
            const capture = token.repeat
                ? `(?:${token.pattern})(?:${prefix}(?:${token.pattern}))*`
                : token.pattern;

            if (keys) keys.push(token);

            if (token.optional) {
                if (token.partial) {
                    route += `${prefix}(${capture})?`
                } else {
                    route += `(?:${prefix}(${capture}))?`
                }
            } else {
                route += `${prefix}(${capture})`
            }
        }
    }

    if (end) {
        if (!strict) route += `(?:${ESCAPED_DEFAULT_DELIMITER})?`;

        route += endsWith === '$' ? '$' : `(?=${endsWith})`
    } else {
        if (!strict) route += `(?:${ESCAPED_DEFAULT_DELIMITER}(?=${endsWith}))?`;
        if (!isEndDelimited) route += `(?=${ESCAPED_DEFAULT_DELIMITER}|${endsWith})`
    }

    return new RegExp(`^${route}`, flags(options))
}

export default function pathToRegexp (path:Path, keys:Key[], options:Options):RegExp {
    if (path instanceof RegExp) {
        return regexpToRegexp(path, keys)
    }

    if (Array.isArray(path)) {
        return arrayToRegexp(path, keys, options)
    }

    return stringToRegexp(path, keys, options)
}
