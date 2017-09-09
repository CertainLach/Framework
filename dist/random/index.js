(function (dependencies, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    }
})(["require", "exports", "seedrandom"], function (require, exports) {
    "use strict";
    var seedrandom = require("seedrandom");
    var Random = (function () {
        function Random(seed) {
            this.wrapped = seedrandom(seed);
        }
        Random.prototype.nextFloat = function () {
            return this.wrapped();
        };
        Random.prototype.nextInt = function (min, max) {
            if (!max) {
                max = min;
                min = 0;
            }
            min = +min;
            max = +max;
            return Math.floor(min + this.nextFloat() * (max + 1 - min));
        };
        Random.prototype.randomArrayElement = function (array) {
            return array[Math.floor(this.nextFloat() * array.length)];
        };
        Random.prototype.randomColor = function () {
            var r = this.nextInt(0, 255).toString(16).padStart(2, '0');
            var g = this.nextInt(0, 255).toString(16).padStart(2, '0');
            var b = this.nextInt(0, 255).toString(16).padStart(2, '0');
            return '#' + r + g + b;
        };
        return Random;
    }());
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.default = Random;
});
//# sourceMappingURL=index.js.map