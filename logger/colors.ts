import emojiMap from '@meteor-it/emoji';

export function emojify(string) {
	let ret = string;
	let matches = ret.match(/(:[^:]+:)/g) || [];
	matches.forEach(match => {
		ret = ret.replace(match, emojiMap[match.substr(1, match.length - 2)] || match);
	});
	return ret;
}
export function addStyle(string, style) {
	return `{${style.replace(/[{}]/g,'')}}${string}{/${style.replace(/[{}]/g,'')}}`;
}
export function resetStyles(string) {
	return string.replace(/{[^}]+}[^{]+{\/[^}]+}/g, '');
}

declare global {
    interface String {
        addStyle(style: string) : string
        emojify(style: string) : string;
        resetStyles(style: string) : string;
        reset:string;
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

String.prototype.addStyle = function(style) {
	return addStyle(this, style);
};
String.prototype.emojify = function() {
	return emojify(this);
};
String.prototype.resetStyles = function() {
	return resetStyles(this);
};

function defineDecorator(color) {
	try{
		Object.defineProperty(String.prototype, color, {
			get: function() {
				return this.addStyle(color);
			}
		});
	}catch(e){}
}

["reset", "bold", "dim", "italic", "underline", "inverse", "hidden", "strikethrough", "black", "red", "green", "yellow", "blue", "magenta", "cyan", "white", "gray", "bgBlack", "bgRed", "bgGreen", "bgYellow", "bgBlue", "bgMagenta", "bgCyan", "bgWhite"].forEach(defineDecorator);
