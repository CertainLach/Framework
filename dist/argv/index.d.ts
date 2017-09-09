export default class ArgParser {
    specs: {};
    commands: {};
    name: any;
    constructor(name: any);
    command(name: any): {
        options(specs: any): any;
        opts(specs: any): any;
        option(name: any, spec: any): any;
        callback(cb: any): any;
        help(help: any): any;
        usage(usage: any): any;
    };
    default(): any;
    options(specs: any): this;
    option(name: any, spec: any): this;
    usage(usage: any): this;
    script(script: any): this;
    help(help: any): this;
    print(str: any, code: any): void;
    parse(argv?: string[]): any;
    getUsage(): any;
    opt(arg: any): any;
    setOption(options: any, arg: any, value: any): void;
}
