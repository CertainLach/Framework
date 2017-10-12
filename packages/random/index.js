import * as seedrandom from 'seedrandom';
var Random = /** @class */ (function () {
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
export default Random;
//# sourceMappingURL=index.js.map