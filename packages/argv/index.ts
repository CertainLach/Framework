import {objectMap} from '@meteor-it/utils';
import Logger from '@meteor-it/logger';

import {basename} from 'path';

export type IOption = {
    string?:string;
    abbr?:string;
    full?:string;
    metavar?:string;
    position?:number;
    name?:string;
    list?:boolean;
    matches?:(arg:string|number)=>boolean;
    required?:boolean;
    default?:string|boolean;
    help?:string;
    hidden?:boolean;
    callback?:(value:any)=>string;
    transform?:(value:any)=>any;
    choices?:string[];
    type?:'string';
    flag?:boolean;
}
export type IArgument = {
    str?:string;
    chars?:string[];
    full?:string;
    value?:string|boolean;
    isValue?:boolean;
}
export type ISpecs = {
    [key:string]:IOption|IOption[]
};
export type ICommand = {
    name?:string;
    specs?:ISpecs;
    usage?:string;
    help?:string;
    cb?:(args:any)=>void;
}
export default class ArgParser {
    private specs:ISpecs = {};
    private commands:{[key:string]:ICommand}={};
    private currentCommand:ICommand;
    logger:Logger;
    private fallback:ICommand;
    usage:string;
    help:string = '';
    script:string;

    constructor(name: string|Logger){
        if(!name)
            throw new Error('ArgParser needs a name/logger!');
        this.logger = Logger.from(name);
    }

    command(name?:string) {
        let command:ICommand;
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
        // Chaining api
        const chain = {
            options(specs:ISpecs) {
                command.specs = specs;
                return chain;
            },
            option(name:string, spec:IOption) {
                command.specs[name] = spec;
                return chain;
            },
            callback(cb:(args:any)=>void) {
                command.cb = cb;
                return chain;
            },
            help(help:string) {
                command.help = help;
                return chain;
            },
            usage(usage:string) {
                command.usage = usage;
                return chain;
            }
        };
        return chain;
    }

    default() {
        return this.command();
    }

    options(specs:ISpecs) {
        this.specs = specs;
        return this;
    }

    option(name:string, spec:IOption) {
        this.specs[name] = spec;
        return this;
    }

    print(str:string, code:number|null=null) {
        this.logger.log(str.trim());
        if(code!=null)
            process.exit(code);
    }

    parse(argv = process.argv.slice(2)) {
        this.script = this.script || `${process.argv[0]} ${basename(process.argv[1])}`;

        let arg = normalizeArgumentString(argv[0]).isValue && argv[0];
        let command:ICommand = arg && this.commands[arg];
        let commandExpected = Object.keys(this.commands).length !== 0;
        
        if (commandExpected) {
            if (command) {
                this.specs={...this.specs,...command.specs};
                this.script += " " + command.name;
                if (command.help) {
                    this.help = command.help;
                }
                this.currentCommand = command;
            }
            else if (arg) {
                return this.print(this.script + ": "+("{red}{bold}No such command '" + arg + "'{/bold}{/red}"), 1);
            }
            else {
                // no command but command expected e.g. 'git -v'
                let helpStringBuilder:{[key:string]:()=>string} = {
                    list:():string=>{
                        return 'One of: ' + Object.keys(this.commands).join(", ");
                    },
                    twoColumn:():string=>{
                        // find the longest command name to ensure horizontal alignment
                        let maxLength = Object.values(this.commands).sort((a:ICommand,b:ICommand)=>a.name.length<b.name.length)[0].name.length;

                        // create the two column text strings
                        let cmdHelp = objectMap(this.commands, (cmd:ICommand,name:string)=>{
                            let diff = maxLength - name.length;
                            let pad = new Array(diff + 4).join(" ");
                            return "  " + [`{green}${name}{/green}`, pad, cmd.help].join(" ");
                        });
                        return "\n" + cmdHelp.join("\n");
                    }
                };

                // if there are a small number of commands and all have help strings,
                // display them in a two column table; otherwise use the brief version.
                // The arbitrary choice of "20" comes from the number commands git
                // displays as "common commands"
                let helpType = 'list';
                if (Object.keys(this.commands).length <= 20) {
                    if(Object.values(this.commands).filter((cmd:ICommand)=>!!cmd.help).length!==0)
                        helpType = 'twoColumn';
                }

                this.specs.command = {
                    name: 'command',
                    position: 0,
                    help: helpStringBuilder[helpType]()
                };

                if (this.fallback) {
                    this.specs={...this.specs,...this.fallback.specs};
                    this.help = this.fallback.help;
                }
                else {
                    (this.specs.command as IOption).required = true;
                }
            }
        }

        if (this.specs.length === undefined) {
            // specs is a hash not an array
            (this.specs as any) = objectMap(this.specs, (opt:IOption, name:string) => {
                opt.name = name;
                return opt;
            });
        }
        Object.keys(this.specs).forEach(key=>{
            this.specs[key]=normalizeOption(this.specs[key] as IOption);
        });

        if (argv.includes("--help") || argv.includes("-h")) {
            return this.print(this.getUsage());
        }

        const options:any = {};
        const args = argv.map(arg => normalizeArgumentString(arg))
            .concat(normalizeArgumentString(null));

        const positionals:(string|boolean)[] = [];

        /* parse the args */
        const that = this;
        args.reduce((arg, val) => {
            /* positional */
            if (arg.isValue) {
                positionals.push(arg.value);
            }
            else if (arg.chars) {
                const last = arg.chars.pop();

                /* -cfv */
                (arg.chars).forEach(ch => {
                    that.setOption(options, ch, true);
                });

                /* -v key */
                if (!that.opt(last).flag) {
                    if (val.isValue) {
                        that.setOption(options, last, val.value);
                        return normalizeArgumentString(null); // skip next turn - swallow arg
                    }
                    else {
                        that.print(`'-${that.opt(last).name || last}' expects a value\n\n${that.getUsage()}`, 1);
                    }
                }
                else {
                    /* -v */
                    that.setOption(options, last, true);
                }

            }
            else if (arg.full) {
                let value = arg.value;

                /* --key */
                if (value === undefined) {
                    /* --key value */
                    if (!that.opt(arg.full).flag) {
                        if (val.isValue) {
                            that.setOption(options, arg.full, val.value);
                            return normalizeArgumentString(null);
                        }
                        else {
                            that.print(`'--${that.opt(arg.full).name || arg.full}' expects a value\n\n${that.getUsage()}`, 1);
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

        positionals.forEach((pos, index)=>{
            this.setOption(options, index as any as string, pos);
        });

        options._ = positionals;

        Object.values(this.specs).forEach((opt:IOption) => {
            if (opt.default !== undefined && options[opt.name] === undefined) {
                options[opt.name] = opt.default;
            }
        }, this);

        // exit if required arg isn't present
        Object.values(this.specs).forEach((opt:IOption)=>{
            if (opt.required && options[opt.name] === undefined) {
                let msg = `{red}{bold}"${opt.name}" argument is required{/bold}{/red}`;

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
        if (this.command && (<any>this.command)._usage) {
            return (<any>this.command)._usage;
        }
        if (this.usage) {
            return this.usage;
        }

        // todo: use a template
        let str = "{blue}{bold}Usage:{/bold}{/blue}";
        str += ` ${basename(this.script)}`;

        let positionals = Object.values(this.specs).filter((opt:IOption) => opt.position != undefined);
        positionals = positionals.sort((opt:IOption) => opt.position);
        const options = Object.values(this.specs).filter((opt:IOption) => opt.position === undefined);

        // assume there are no gaps in the specified pos. args
        positionals.forEach((pos:IOption) => {
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
            str += " {blue}[options]{/blue}";
        }

        if (options.length || positionals.length) {
            str += "\n\n";
        }

        let longest = positionals.reduce((max:IOption, pos:IOption) => pos.name.length > max ? pos.name.length : max, 0);

        positionals.forEach((pos:IOption)=>{
            const posStr = pos.string || pos.name;
            str += `${posStr + ' '.repeat(longest - posStr.length)}     `;
            str += `{gray}${(pos.help || "")}{/gray}\n`;
        });
        if (positionals.length && options.length) {
            str += "\n";
        }

        if (options.length) {
            str += "{blue}Options:{/blue}";
            str += "\n";

            let longest = options.reduce((max:IOption, opt:IOption) => opt.string.length > max && !opt.hidden ? opt.string.length : max, 0);

            options.forEach((opt:IOption)=>{
                if (!opt.hidden) {
                    str += `   ${opt.string}${' '.repeat(longest - opt.string.length)}   {gray}${opt.help ? opt.help + (opt.default != null ? ` {bold}[Default: ${opt.default}]{/bold}` : "") : ""}{/gray}\n`;
                }
            });
        }

        if (this.help) {
            str += `\n${this.help}`;
        }
        return str;
    }

    private opt(arg:string):IOption {
        // get the specified opt for this parsed arg
        let match = normalizeOption({});
        Object.values(this.specs).forEach((opt:IOption) => {
            if (opt.matches(arg)) {
                match = opt;
            }
        });
        return match;
    }

    private setOption(options:ISpecs, arg:string, value:any) {
        const option = this.opt(arg);
        if (option.callback) {
            const message = option.callback(value);

            if (typeof message == "string") {
                this.print(message, 1);
            }
        }

        if (option.type != "string") {
            try {
                // infer type by JSON parsing the string
                value = JSON.parse(value);
            }
            catch (e) {}
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
                (options[name] as IOption[]).push(value);
            }
        }
        else {
            options[name] = value;
        }
    }
}

function normalizeArgumentString(str:string):IArgument {
    const abbrRegex = /^-(\w+?)$/;
    const fullRegex = /^--(no-)?(.+?)(?:=(.+))?$/;
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
function normalizeOption(opt:IOption):IOption{
    const strings = (opt.string || "").split(",");
    let abbr;
    let full;
    let metavar = null;
    let matches = null;
    for (let i = 0; i < strings.length; i++) {
        let string = strings[i].trim();
        if (matches = string.match(/^-([^-])(?:\s+(.*))?$/)) {
            abbr = matches[1];
            metavar = matches[2];
        }
        else if (matches = string.match(/^--(.+?)(?:[=\s]+(.+))?$/)) {
            full = matches[1];
            metavar = metavar || matches[2];
        }
    }

    //matches = matches || [];

    abbr = opt.abbr || abbr; // e.g. PATH from '--config=PATH'

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

    opt = {
        ...opt,
        name: opt.name || full || abbr,
        string,
        abbr,
        full,
        metavar,
        matches(arg:string|number) {
            return opt.full == arg || opt.abbr == arg || opt.position == arg ||
                opt.name == arg || (opt.list && arg >= opt.position);
        }
    };
    return opt;
}