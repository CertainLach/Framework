import Logger from '@meteor-it/logger';
export default class ArgParser {
    specs: any;
    commands: any[];
    logger: Logger;
    fallback: any;
    _usage: any;
    _script: any;
    _help: any;
    constructor(name: string | Logger);
    command(name?: any): {
        options(specs: any): any;
        opts(specs: any): any;
        option(name: any, spec: any): any;
        callback(cb: any): any;
        help(help: any): any;
        usage(usage: any): any;
    };
    default(): {
        options(specs: any): any;
        opts(specs: any): any;
        option(name: any, spec: any): any;
        callback(cb: any): any;
        help(help: any): any;
        usage(usage: any): any;
    };
    options(specs: any): this;
    option(name: any, spec: any): this;
    usage(usage: any): this;
    script(script: any): this;
    help(help: any): this;
    print(str: string, code?: number): void;
    parse(argv?: string[]): any;
    getUsage(): any;
    opt(arg: any): any;
    setOption(options: any, arg: any, value: any): void;
}
