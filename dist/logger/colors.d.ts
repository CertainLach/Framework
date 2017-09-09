export declare function emojify(string: any): any;
export declare function addStyle(string: any, style: any): string;
export declare function resetStyles(string: any): any;
declare global  {
    interface String {
        addStyle(style: string): string;
        emojify(): string;
        resetStyles(): string;
        reset: string;
        bold: string;
        dim: string;
        italic: string;
        underline: string;
        inverse: string;
        hidden: string;
        strikethrough: string;
        black: string;
        red: string;
        green: string;
        yellow: string;
        blue: string;
        magenta: string;
        cyan: string;
        white: string;
        gray: string;
        bgBlack: string;
        bgRed: string;
        bgGreen: string;
        bgYellow: string;
        bgBlue: string;
        bgMagenta: string;
        bgCyan: string;
        bgWhite: string;
    }
}
export {};
