(function (dependencies, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    }
})(["require", "exports", "@meteor-it/emoji"], function (require, exports) {
    "use strict";
    var emoji_1 = require("@meteor-it/emoji");
    function emojify(string) {
        var ret = string;
        var matches = ret.match(/(:[^:]+:)/g) || [];
        matches.forEach(function (match) {
            ret = ret.replace(match, emoji_1.default[match.substr(1, match.length - 2)] || match);
        });
        return ret;
    }
    exports.emojify = emojify;
    function addStyle(string, style) {
        return "{" + style.replace(/[{}]/g, '') + "}" + string + "{/" + style.replace(/[{}]/g, '') + "}";
    }
    exports.addStyle = addStyle;
    function resetStyles(string) {
        return string.replace(/{[^}]+}[^{]+{\/[^}]+}/g, '');
    }
    exports.resetStyles = resetStyles;
    String.prototype.addStyle = function (style) {
        return addStyle(this, style);
    };
    String.prototype.emojify = function () {
        return emojify(this);
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
});
//# sourceMappingURL=colors.js.map