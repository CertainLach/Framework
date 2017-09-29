"use strict";
function addStyle(string, style) {
    return `{${style.replace(/[{}]/g, '')}}${string}{/${style.replace(/[{}]/g, '')}}`;
}
exports.addStyle = addStyle;
function resetStyles(string) {
    return string.replace(/{[^}]+}[^{]+{\/[^}]+}/g, '');
}
exports.resetStyles = resetStyles;
String.prototype.addStyle = function (style) {
    return addStyle(this, style);
};
String.prototype.resetStyles = function () {
    return resetStyles(this);
};
function defineDecorator(color) {
    try {
        Object.defineProperty(String.prototype, color, {
            get: function () {
                return this.addStyle(color);
            }
        });
    }
    catch (e) { }
}
["reset", "bold", "dim", "italic", "underline", "inverse", "hidden", "strikethrough", "black", "red", "green", "yellow", "blue", "magenta", "cyan", "white", "gray", "bgBlack", "bgRed", "bgGreen", "bgYellow", "bgBlue", "bgMagenta", "bgCyan", "bgWhite"].forEach(defineDecorator);
//# sourceMappingURL=colors.js.map