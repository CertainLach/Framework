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
	Object.defineProperty(String.prototype, color, {
		get: function() {
			return this.addStyle(color);
		}
	});
}

["reset", "bold", "dim", "italic", "underline", "inverse", "hidden", "strikethrough", "black", "red", "green", "yellow", "blue", "magenta", "cyan", "white", "gray", "bgBlack", "bgRed", "bgGreen", "bgYellow", "bgBlue", "bgMagenta", "bgCyan", "bgWhite"].forEach(defineDecorator);
