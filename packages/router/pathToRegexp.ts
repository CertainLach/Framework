const DEFAULT_DELIMITER = '/';
const DEFAULT_DELIMITERS = './';

const PATH_REGEXP = new RegExp('(\\\\.)|(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?', 'g');

function parse (str:string, options) {
    const tokens = [];
    let key = 0;
    let index = 0;
    let path = '';
    const defaultDelimiter = options.delimiter||DEFAULT_DELIMITER;
    const delimiters = options.delimiters||DEFAULT_DELIMITERS;
    let pathEscaped = false;
    let res;
    while ((res = PATH_REGEXP.exec(str)) !== null) {
        const m = res[0];
        const escaped = res[1];
        const offset = res.index;
        path += str.slice(index, offset);
        index = offset + m.length;
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

            if (delimiters.indexOf(path[k]) > -1) {
                prev = path[k];
                path = path.slice(0, k)
            }
        }

        if (path) {
            tokens.push(path);
            path = '';
            pathEscaped = false
        }

        const partial = prev !== '' && next !== undefined && next !== prev;
        const repeat = modifier === '+' || modifier === '*';
        const optional = modifier === '?' || modifier === '*';
        const delimiter = prev || defaultDelimiter;
        const pattern = capture || group;

        tokens.push({
            name: name || key++,
            prefix: prev,
            delimiter: delimiter,
            optional: optional,
            repeat: repeat,
            partial: partial,
            pattern: pattern ? escapeGroup(pattern) : '[^' + escapeString(delimiter) + ']+?'
        })
    }

    if (path || index < str.length) {
        tokens.push(path + str.substr(index))
    }

    return tokens
}
function compile (str:string, options) {
    return tokensToFunction(parse(str, options))
}
function tokensToFunction (tokens) {
    const matches = new Array(tokens.length);

    for (let i = 0; i < tokens.length; i++) {
        if (typeof tokens[i] === 'object') {
            matches[i] = new RegExp('^(?:' + tokens[i].pattern + ')$')
        }
    }

    return function (data, options) {
        let path = '';
        const encode = (options && options.encode) || encodeURIComponent;

        for (let i = 0; i < tokens.length; i++) {
            let token = tokens[i];

            if (typeof token === 'string') {
                path += token;
                continue
            }

            let value = data ? data[token.name] : undefined;
            let segment;

            if (Array.isArray(value)) {
                if (!token.repeat) {
                    throw new TypeError('Expected "' + token.name + '" to not repeat, but got array')
                }

                if (value.length === 0) {
                    if (token.optional) continue;

                    throw new TypeError('Expected "' + token.name + '" to not be empty')
                }

                for (let j = 0; j < value.length; j++) {
                    segment = encode(value[j], token);

                    if (!matches[i].test(segment)) {
                        throw new TypeError('Expected all "' + token.name + '" to match "' + token.pattern + '"')
                    }

                    path += (j === 0 ? token.prefix : token.delimiter) + segment
                }

                continue
            }

            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
                segment = encode(String(value), token);

                if (!matches[i].test(segment)) {
                    throw new TypeError('Expected "' + token.name + '" to match "' + token.pattern + '", but got "' + segment + '"')
                }

                path += token.prefix + segment;
                continue
            }

            if (token.optional) {
                // Prepend partial segment prefixes.
                if (token.partial) path += token.prefix;

                continue
            }

            throw new TypeError('Expected "' + token.name + '" to be ' + (token.repeat ? 'an array' : 'a string'))
        }

        return path
    }
}

function escapeString (str) {
    return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, '\\$1')
}

function escapeGroup (group) {
    return group.replace(/([=!:$/()])/g, '\\$1')
}

function flags (options) {
    return options && options.sensitive ? '' : 'i'
}

function regexpToRegexp (path, keys) {
    if (!keys) return path;

    const groups = path.source.match(/\((?!\?)/g);

    if (groups) {
        for (let i = 0; i < groups.length; i++) {
            keys.push({
                name: i,
                prefix: null,
                delimiter: null,
                optional: false,
                repeat: false,
                partial: false,
                pattern: null
            })
        }
    }

    return path
}

function arrayToRegexp (path, keys, options) {
    const parts = [];

    for (let i = 0; i < path.length; i++) {
        parts.push(pathToRegexp(path[i], keys, options).source)
    }

    return new RegExp('(?:' + parts.join('|') + ')', flags(options))
}
function stringToRegexp (path, keys, options) {
    return tokensToRegExp(parse(path, options), keys, options)
}

function tokensToRegExp (tokens, keys, options) {
    options = options || {};

    let strict = options.strict;
    const end = options.end !== false;
    const delimiter = escapeString(options.delimiter || DEFAULT_DELIMITER);
    const delimiters = options.delimiters || DEFAULT_DELIMITERS;
    const endsWith = [].concat(options.endsWith || []).map(escapeString).concat('$').join('|');
    let route = '';
    let isEndDelimited = false;

    // Iterate over the tokens and create our regexp string.
    for (let i = 0; i < tokens.length; i++) {
        let token = tokens[i];

        if (typeof token === 'string') {
            route += escapeString(token);
            isEndDelimited = i === tokens.length - 1 && delimiters.indexOf(token[token.length - 1]) > -1
        } else {
            const prefix = escapeString(token.prefix);
            const capture = token.repeat
                ? '(?:' + token.pattern + ')(?:' + prefix + '(?:' + token.pattern + '))*'
                : token.pattern;

            if (keys) keys.push(token);

            if (token.optional) {
                if (token.partial) {
                    route += prefix + '(' + capture + ')?'
                } else {
                    route += '(?:' + prefix + '(' + capture + '))?'
                }
            } else {
                route += prefix + '(' + capture + ')'
            }
        }
    }

    if (end) {
        if (!strict) route += '(?:' + delimiter + ')?';

        route += endsWith === '$' ? '$' : '(?=' + endsWith + ')'
    } else {
        if (!strict) route += '(?:' + delimiter + '(?=' + endsWith + '))?';
        if (!isEndDelimited) route += '(?=' + delimiter + '|' + endsWith + ')'
    }

    return new RegExp('^' + route, flags(options))
}

export default function pathToRegexp (path, keys, options?) {
    if (path instanceof RegExp) {
        return regexpToRegexp(path, keys)
    }

    if (Array.isArray(path)) {
        return arrayToRegexp(path, keys, options)
    }

    return stringToRegexp(path, keys, options)
}
