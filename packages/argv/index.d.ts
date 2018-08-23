import Logger from '@meteor-it/logger';
export declare type IOption = {
    string?: string;
    abbr?: string;
    full?: string;
    metavar?: string;
    position?: number;
    name?: string;
    list?: boolean;
    matches?: (arg: string | number) => boolean;
    required?: boolean;
    default?: string | boolean;
    help?: string;
    hidden?: boolean;
    callback?: (value: any) => string;
    transform?: (value: any) => any;
    choices?: string[];
    type?: 'string';
    flag?: boolean;
};
export declare type IArgument = {
    str?: string;
    chars?: string[];
    full?: string;
    value?: string | boolean;
    isValue?: boolean;
};
export declare type ISpecs = {
    [key: string]: IOption | IOption[];
};
export declare type ICommand = {
    name?: string;
    specs?: ISpecs;
    usage?: string;
    help?: string;
    cb?: (args: any) => void;
};
export default class ArgParser {
    private specs;
    private commands;
    private currentCommand;
    logger: Logger;
    private fallback;
    usage: string;
    help: string;
    script: string;
    constructor(name: string | Logger);
    command(name?: string): {
        options(specs: ISpecs): any;
        option(name: string, spec: IOption): any;
        callback(cb: (args: any) => void): any;
        help(help: string): any;
        usage(usage: string): any;
    };
    default(): {
        options(specs: ISpecs): any;
        option(name: string, spec: IOption): any;
        callback(cb: (args: any) => void): any;
        help(help: string): any;
        usage(usage: string): any;
    };
    options(specs: ISpecs): this;
    option(name: string, spec: IOption): this;
    print(str: string, code?: number | null): void;
    parse(argv?: string[]): any;
    getUsage(): any;
    private opt(arg);
    private setOption(options, arg, value);
}
