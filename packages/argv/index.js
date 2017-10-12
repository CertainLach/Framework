// Nomnom by harthur, will be maintained by meteor-it
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
import { objectMap } from '@meteor-it/utils';
import Logger from '@meteor-it/logger';
import { basename } from 'path';
var ArgParser = /** @class */ (function () {
    function ArgParser(name) {
        this.specs = {};
        this.commands = [];
        if (!name)
            throw new Error('ArgParser needs a name/logger!');
        if (name instanceof Logger) {
            this.logger = new Logger(name);
        }
        else {
            this.logger = new Logger(name);
        }
    }
    ArgParser.prototype.command = function (name) {
        var command;
        if (name) {
            command = this.commands[name] = {
                name: name,
                specs: {}
            };
        }
        else {
            command = this.fallback = {
                specs: {}
            };
        }
        // facilitates command('name').options().cb().help()
        var chain = {
            options: function (specs) {
                command.specs = specs;
                return chain;
            },
            opts: function (specs) {
                // old API
                return this.options(specs);
            },
            option: function (name, spec) {
                command.specs[name] = spec;
                return chain;
            },
            callback: function (cb) {
                command.cb = cb;
                return chain;
            },
            help: function (help) {
                command.help = help;
                return chain;
            },
            usage: function (usage) {
                command._usage = usage;
                return chain;
            }
        };
        return chain;
    };
    ArgParser.prototype.default = function () {
        return this.command();
    };
    ArgParser.prototype.options = function (specs) {
        this.specs = specs;
        return this;
    };
    ArgParser.prototype.option = function (name, spec) {
        this.specs[name] = spec;
        return this;
    };
    ArgParser.prototype.usage = function (usage) {
        this._usage = usage;
        return this;
    };
    ArgParser.prototype.script = function (script) {
        this._script = script;
        return this;
    };
    ArgParser.prototype.help = function (help) {
        this._help = help;
        return this;
    };
    ArgParser.prototype.print = function (str, code) {
        if (code === void 0) { code = 0; }
        this.logger.log(str.trim());
        process.exit(code);
    };
    ArgParser.prototype.parse = function (argv) {
        var _this = this;
        if (argv === void 0) { argv = process.argv.slice(2); }
        this._help = this._help || "";
        this._script = this._script || process.argv[0] + " " + basename(process.argv[1]);
        this.specs = this.specs || {};
        var arg = Arg(argv[0]).isValue && argv[0];
        var command = arg && this.commands[arg];
        var commandExpected = Object.keys(this.commands).length !== 0;
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
                // no command but command expected e.g. 'git -v'
                var helpStringBuilder = {
                    list: function () {
                        return 'One of: ' + Object.keys(this.commands).join(", ");
                    },
                    twoColumn: function () {
                        // find the longest command name to ensure horizontal alignment
                        var maxLength = Object.values(this.commands).sort(function (a, b) { return a.name.length < b.name.length; })[0].name.length;
                        // create the two column text strings
                        var cmdHelp = objectMap(this.commands, function (cmd, name) {
                            var diff = maxLength - name.length;
                            var pad = new Array(diff + 4).join(" ");
                            return "  " + [name.green, pad, cmd.help].join(" ");
                        });
                        return "\n" + cmdHelp.join("\n");
                    }
                };
                // if there are a small number of commands and all have help strings,
                // display them in a two column table; otherwise use the brief version.
                // The arbitrary choice of "20" comes from the number commands git
                // displays as "common commands"
                var helpType = 'list';
                if (Object.keys(this.commands).length <= 20) {
                    if (Object.values(this.commands).filter(function (cmd) { return !!cmd.help; }).length !== 0)
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
            // specs is a hash not an array
            this.specs = objectMap(this.specs, function (opt, name) {
                opt.name = name;
                return opt;
            });
        }
        this.specs = this.specs.map(function (opt) { return Opt(opt); });
        if (argv.includes("--help") || argv.includes("-h")) {
            return this.print(this.getUsage());
        }
        var options = {};
        var args = argv.map(function (arg) { return Arg(arg); })
            .concat(Arg());
        var positionals = [];
        /* parse the args */
        var that = this;
        args.reduce(function (arg, val) {
            /* positional */
            if (arg.isValue) {
                positionals.push(arg.value);
            }
            else if (arg.chars) {
                var last = arg.chars.pop();
                /* -cfv */
                (arg.chars).forEach(function (ch) {
                    that.setOption(options, ch, true);
                });
                /* -v key */
                if (!that.opt(last).flag) {
                    if (val.isValue) {
                        that.setOption(options, last, val.value);
                        return Arg(); // skip next turn - swallow arg
                    }
                    else {
                        that.print("'-" + (that.opt(last).name || last) + "' expects a value\n\n" + that.getUsage(), 1);
                    }
                }
                else {
                    /* -v */
                    that.setOption(options, last, true);
                }
            }
            else if (arg.full) {
                var value = arg.value;
                /* --key */
                if (value === undefined) {
                    /* --key value */
                    if (!that.opt(arg.full).flag) {
                        if (val.isValue) {
                            that.setOption(options, arg.full, val.value);
                            return Arg();
                        }
                        else {
                            that.print("'--" + (that.opt(arg.full).name || arg.full) + "' expects a value\n\n" + that.getUsage(), 1);
                        }
                    }
                    else {
                        /* --flag */
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
        this.specs.forEach(function (opt) {
            if (opt.default !== undefined && options[opt.name] === undefined) {
                options[opt.name] = opt.default;
            }
        }, this);
        // exit if required arg isn't present
        this.specs.forEach(function (opt) {
            if (opt.required && options[opt.name] === undefined) {
                var msg = ("\"" + opt.name + "\" argument is required").bold.red;
                _this.print("\n" + msg + "\n" + _this.getUsage(), 1);
            }
        });
        if (command && command.cb) {
            command.cb(options);
        }
        else if (this.fallback && this.fallback.cb) {
            this.fallback.cb(options);
        }
        return options;
    };
    ArgParser.prototype.getUsage = function () {
        if (this.command && this.command._usage) {
            return this.command._usage;
        }
        if (this._usage) {
            return this._usage;
        }
        // todo: use a template
        var str = "Usage:".bold.blue;
        str += " " + basename(this._script);
        var positionals = this.specs.filter(function (opt) { return opt.position != undefined; });
        positionals = positionals.sort(function (opt) { return opt.position; });
        var options = this.specs.filter(function (opt) { return opt.position === undefined; });
        // assume there are no gaps in the specified pos. args
        positionals.forEach(function (pos) {
            str += " ";
            var posStr = pos.string;
            if (!posStr) {
                posStr = pos.name || "arg" + pos.position;
                if (pos.required) {
                    posStr = "<" + posStr + ">";
                }
                else {
                    posStr = "[" + posStr + "]";
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
            var spaces = "";
            for (var i = 0; i < length; i++) {
                spaces += " ";
            }
            return spaces;
        }
        var longest = positionals.reduce(function (max, pos) { return pos.name.length > max ? pos.name.length : max; }, 0);
        positionals.forEach(function (pos) {
            var posStr = pos.string || pos.name;
            str += posStr + spaces(longest - posStr.length) + "     ";
            str += (pos.help || "").gray;
            str += "\n";
        }, this);
        if (positionals.length && options.length) {
            str += "\n";
        }
        if (options.length) {
            str += "Options:".blue;
            str += "\n";
            var longest_1 = options.reduce(function (max, opt) { return opt.string.length > max && !opt.hidden ? opt.string.length : max; }, 0);
            options.forEach(function (opt) {
                if (!opt.hidden) {
                    str += "   " + opt.string + spaces(longest_1 - opt.string.length) + "   ";
                    var defaults = (opt.default != null ? (" [Default: " + opt.default + "]").bold : "");
                    var help = opt.help ? opt.help + defaults : "";
                    str += help.gray;
                    str += "\n";
                }
            }, this);
        }
        if (this._help) {
            str += "\n" + this._help;
        }
        return str;
    };
    ArgParser.prototype.opt = function (arg) {
        // get the specified opt for this parsed arg
        var match = Opt({});
        this.specs.forEach(function (opt) {
            if (opt.matches(arg)) {
                match = opt;
            }
        });
        return match;
    };
    ArgParser.prototype.setOption = function (options, arg, value) {
        var option = this.opt(arg);
        if (option.callback) {
            var message = option.callback(value);
            if (typeof message == "string") {
                this.print(message, 1);
            }
        }
        if (option.type != "string") {
            try {
                // infer type by JSON parsing the string
                value = JSON.parse(value);
            }
            catch (e) { }
        }
        if (option.transform) {
            value = option.transform(value);
        }
        var name = option.name || arg;
        if (option.choices && !option.choices.includes(value)) {
            this.print(name + " must be one of: " + option.choices.join(", "), 1);
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
    };
    return ArgParser;
}());
export default ArgParser;
function Arg(str) {
    var abbrRegex = /^\-(\w+?)$/;
    var fullRegex = /^\-\-(no\-)?(.+?)(?:=(.+))?$/;
    var valRegex = /^[^\-].*/;
    var charMatch = abbrRegex.exec(str);
    var chars = charMatch && charMatch[1].split("");
    var fullMatch = fullRegex.exec(str);
    var full = fullMatch && fullMatch[2];
    var isValue = str !== undefined && (str === "" || valRegex.test(str));
    var value;
    if (isValue) {
        value = str;
    }
    else if (full) {
        value = fullMatch[1] ? false : fullMatch[3];
    }
    return {
        str: str,
        chars: chars,
        full: full,
        value: value,
        isValue: isValue
    };
}
function Opt(opt) {
    var strings = (opt.string || "").split(",");
    var abbr;
    var full;
    var metavar;
    var matches;
    for (var i = 0; i < strings.length; i++) {
        var string_1 = strings[i].trim();
        if (matches = string_1.match(/^\-([^-])(?:\s+(.*))?$/)) {
            abbr = matches[1];
            metavar = matches[2];
        }
        else if (matches = string_1.match(/^\-\-(.+?)(?:[=\s]+(.+))?$/)) {
            full = matches[1];
            metavar = metavar || matches[2];
        }
    }
    matches = matches || [];
    abbr = opt.abbr || abbr; // e.g. PATH from '--config=PATH'
    full = opt.full || full;
    metavar = opt.metavar || metavar;
    var string;
    if (opt.string) {
        string = opt.string;
    }
    else if (opt.position === undefined) {
        string = "";
        if (abbr) {
            string += "-" + abbr;
            if (metavar)
                string += " " + metavar;
            string += ", ";
        }
        string += "--" + (full || opt.name);
        if (metavar) {
            string += " " + metavar;
        }
    }
    opt = __assign({}, opt, { name: opt.name || full || abbr, string: string,
        abbr: abbr,
        full: full,
        metavar: metavar,
        matches: function (arg) {
            return opt.full == arg || opt.abbr == arg || opt.position == arg ||
                opt.name == arg || (opt.list && arg >= opt.position);
        } });
    return opt;
}
//# sourceMappingURL=index.js.map