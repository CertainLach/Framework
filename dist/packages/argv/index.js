"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
const utils_1 = require("@meteor-it/utils");
const logger_1 = require("@meteor-it/logger");
const path_1 = require("path");
class ArgParser {
    constructor(name) {
        this.specs = {};
        this.commands = [];
        if (!name)
            throw new Error('ArgParser needs a name/logger!');
        if (name instanceof logger_1.default) {
            this.logger = new logger_1.default(name);
        }
        else {
            this.logger = new logger_1.default(name);
        }
    }
    command(name) {
        let command;
        if (name) {
            command = this.commands[name] = {
                name,
                specs: {}
            };
        }
        else {
            command = this.fallback = {
                specs: {}
            };
        }
        const chain = {
            options(specs) {
                command.specs = specs;
                return chain;
            },
            opts(specs) {
                return this.options(specs);
            },
            option(name, spec) {
                command.specs[name] = spec;
                return chain;
            },
            callback(cb) {
                command.cb = cb;
                return chain;
            },
            help(help) {
                command.help = help;
                return chain;
            },
            usage(usage) {
                command._usage = usage;
                return chain;
            }
        };
        return chain;
    }
    default() {
        return this.command();
    }
    options(specs) {
        this.specs = specs;
        return this;
    }
    option(name, spec) {
        this.specs[name] = spec;
        return this;
    }
    usage(usage) {
        this._usage = usage;
        return this;
    }
    script(script) {
        this._script = script;
        return this;
    }
    help(help) {
        this._help = help;
        return this;
    }
    print(str, code = 0) {
        this.logger.log(str.trim());
        process.exit(code);
    }
    parse(argv = process.argv.slice(2)) {
        this._help = this._help || "";
        this._script = this._script || `${process.argv[0]} ${path_1.basename(process.argv[1])}`;
        this.specs = this.specs || {};
        let arg = Arg(argv[0]).isValue && argv[0];
        let command = arg && this.commands[arg];
        let commandExpected = Object.keys(this.commands).length !== 0;
        if (commandExpected) {
            if (command) {
                this.specs = __assign({}, this.specs, command.specs);
                this._script += " " + command.name;
                if (command.help) {
                    this._help = command.help;
                }
                this.command = command;
            }
            else if (arg) {
                return this.print(this._script + ": " + ("No such command '" + arg + "'").bold.red, 1);
            }
            else {
                let helpStringBuilder = {
                    list() {
                        return 'One of: ' + Object.keys(this.commands).join(", ");
                    },
                    twoColumn() {
                        let maxLength = Object.values(this.commands).sort((a, b) => a.name.length < b.name.length)[0].name.length;
                        let cmdHelp = utils_1.objectMap(this.commands, (cmd, name) => {
                            let diff = maxLength - name.length;
                            let pad = new Array(diff + 4).join(" ");
                            return "  " + [name.green, pad, cmd.help].join(" ");
                        });
                        return "\n" + cmdHelp.join("\n");
                    }
                };
                var helpType = 'list';
                if (Object.keys(this.commands).length <= 20) {
                    if (Object.values(this.commands).filter(cmd => !!cmd.help).length !== 0)
                        helpType = 'twoColumn';
                }
                this.specs.command = {
                    name: 'command',
                    position: 0,
                    help: helpStringBuilder[helpType].call(this)
                };
                if (this.fallback) {
                    this.specs = __assign({}, this.specs, this.fallback.specs);
                    this._help = this.fallback.help;
                }
                else {
                    this.specs.command.required = true;
                }
            }
        }
        if (this.specs.length === undefined) {
            this.specs = utils_1.objectMap(this.specs, (opt, name) => {
                opt.name = name;
                return opt;
            });
        }
        this.specs = this.specs.map(opt => Opt(opt));
        if (argv.includes("--help") || argv.includes("-h")) {
            return this.print(this.getUsage());
        }
        const options = {};
        const args = argv.map(arg => Arg(arg))
            .concat(Arg());
        const positionals = [];
        const that = this;
        args.reduce((arg, val) => {
            if (arg.isValue) {
                positionals.push(arg.value);
            }
            else if (arg.chars) {
                const last = arg.chars.pop();
                (arg.chars).forEach(ch => {
                    that.setOption(options, ch, true);
                });
                if (!that.opt(last).flag) {
                    if (val.isValue) {
                        that.setOption(options, last, val.value);
                        return Arg();
                    }
                    else {
                        that.print(`'-${that.opt(last).name || last}' expects a value\n\n${that.getUsage()}`, 1);
                    }
                }
                else {
                    that.setOption(options, last, true);
                }
            }
            else if (arg.full) {
                let value = arg.value;
                if (value === undefined) {
                    if (!that.opt(arg.full).flag) {
                        if (val.isValue) {
                            that.setOption(options, arg.full, val.value);
                            return Arg();
                        }
                        else {
                            that.print(`'--${that.opt(arg.full).name || arg.full}' expects a value\n\n${that.getUsage()}`, 1);
                        }
                    }
                    else {
                        value = true;
                    }
                }
                that.setOption(options, arg.full, value);
            }
            return val;
        });
        positionals.forEach(function (pos, index) {
            this.setOption(options, index, pos);
        }, this);
        options._ = positionals;
        this.specs.forEach(opt => {
            if (opt.default !== undefined && options[opt.name] === undefined) {
                options[opt.name] = opt.default;
            }
        }, this);
        this.specs.forEach(opt => {
            if (opt.required && options[opt.name] === undefined) {
                let msg = `"${opt.name}" argument is required`.bold.red;
                this.print(`\n${msg}\n${this.getUsage()}`, 1);
            }
        });
        if (command && command.cb) {
            command.cb(options);
        }
        else if (this.fallback && this.fallback.cb) {
            this.fallback.cb(options);
        }
        return options;
    }
    getUsage() {
        if (this.command && this.command._usage) {
            return this.command._usage;
        }
        if (this._usage) {
            return this._usage;
        }
        let str = "Usage:".bold.blue;
        str += ` ${path_1.basename(this._script)}`;
        let positionals = this.specs.filter(opt => opt.position != undefined);
        positionals = positionals.sort(opt => opt.position);
        const options = this.specs.filter(opt => opt.position === undefined);
        positionals.forEach(pos => {
            str += " ";
            let posStr = pos.string;
            if (!posStr) {
                posStr = pos.name || `arg${pos.position}`;
                if (pos.required) {
                    posStr = `<${posStr}>`;
                }
                else {
                    posStr = `[${posStr}]`;
                }
                if (pos.list) {
                    posStr += "...";
                }
            }
            str += posStr;
        });
        if (options.length) {
            str += " [options]".blue;
        }
        if (options.length || positionals.length) {
            str += "\n\n";
        }
        function spaces(length) {
            let spaces = "";
            for (let i = 0; i < length; i++) {
                spaces += " ";
            }
            return spaces;
        }
        let longest = positionals.reduce((max, pos) => pos.name.length > max ? pos.name.length : max, 0);
        positionals.forEach(function (pos) {
            const posStr = pos.string || pos.name;
            str += `${posStr + spaces(longest - posStr.length)}     `;
            str += (pos.help || "").gray;
            str += "\n";
        }, this);
        if (positionals.length && options.length) {
            str += "\n";
        }
        if (options.length) {
            str += "Options:".blue;
            str += "\n";
            let longest = options.reduce((max, opt) => opt.string.length > max && !opt.hidden ? opt.string.length : max, 0);
            options.forEach(function (opt) {
                if (!opt.hidden) {
                    str += `   ${opt.string}${spaces(longest - opt.string.length)}   `;
                    const defaults = (opt.default != null ? ` [Default: ${opt.default}]`.bold : "");
                    const help = opt.help ? opt.help + defaults : "";
                    str += help.gray;
                    str += "\n";
                }
            }, this);
        }
        if (this._help) {
            str += `\n${this._help}`;
        }
        return str;
    }
    opt(arg) {
        let match = Opt({});
        this.specs.forEach(opt => {
            if (opt.matches(arg)) {
                match = opt;
            }
        });
        return match;
    }
    setOption(options, arg, value) {
        const option = this.opt(arg);
        if (option.callback) {
            const message = option.callback(value);
            if (typeof message == "string") {
                this.print(message, 1);
            }
        }
        if (option.type != "string") {
            try {
                value = JSON.parse(value);
            }
            catch (e) { }
        }
        if (option.transform) {
            value = option.transform(value);
        }
        const name = option.name || arg;
        if (option.choices && !option.choices.includes(value)) {
            this.print(`${name} must be one of: ${option.choices.join(", ")}`, 1);
        }
        if (option.list) {
            if (!options[name]) {
                options[name] = [value];
            }
            else {
                options[name].push(value);
            }
        }
        else {
            options[name] = value;
        }
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ArgParser;
function Arg(str) {
    const abbrRegex = /^\-(\w+?)$/;
    const fullRegex = /^\-\-(no\-)?(.+?)(?:=(.+))?$/;
    const valRegex = /^[^\-].*/;
    const charMatch = abbrRegex.exec(str);
    const chars = charMatch && charMatch[1].split("");
    const fullMatch = fullRegex.exec(str);
    const full = fullMatch && fullMatch[2];
    const isValue = str !== undefined && (str === "" || valRegex.test(str));
    let value;
    if (isValue) {
        value = str;
    }
    else if (full) {
        value = fullMatch[1] ? false : fullMatch[3];
    }
    return {
        str,
        chars,
        full,
        value,
        isValue
    };
}
function Opt(opt) {
    const strings = (opt.string || "").split(",");
    let abbr;
    let full;
    let metavar;
    let matches;
    for (let i = 0; i < strings.length; i++) {
        let string = strings[i].trim();
        if (matches = string.match(/^\-([^-])(?:\s+(.*))?$/)) {
            abbr = matches[1];
            metavar = matches[2];
        }
        else if (matches = string.match(/^\-\-(.+?)(?:[=\s]+(.+))?$/)) {
            full = matches[1];
            metavar = metavar || matches[2];
        }
    }
    matches = matches || [];
    abbr = opt.abbr || abbr;
    full = opt.full || full;
    metavar = opt.metavar || metavar;
    let string;
    if (opt.string) {
        string = opt.string;
    }
    else if (opt.position === undefined) {
        string = "";
        if (abbr) {
            string += `-${abbr}`;
            if (metavar)
                string += ` ${metavar}`;
            string += ", ";
        }
        string += `--${full || opt.name}`;
        if (metavar) {
            string += ` ${metavar}`;
        }
    }
    opt = __assign({}, opt, { name: opt.name || full || abbr, string,
        abbr,
        full,
        metavar,
        matches(arg) {
            return opt.full == arg || opt.abbr == arg || opt.position == arg ||
                opt.name == arg || (opt.list && arg >= opt.position);
        } });
    return opt;
}
//# sourceMappingURL=index.js.map