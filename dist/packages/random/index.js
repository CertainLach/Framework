"use strict";
const seedrandom = require("seedrandom");
class Random {
    constructor(seed) {
        this.wrapped = seedrandom(seed);
    }
    nextFloat() {
        return this.wrapped();
    }
    nextInt(min, max) {
        if (!max) {
            max = min;
            min = 0;
        }
        min = +min;
        max = +max;
        return Math.floor(min + this.nextFloat() * (max + 1 - min));
    }
    randomArrayElement(array) {
        return array[Math.floor(this.nextFloat() * array.length)];
    }
    randomColor() {
        let r = this.nextInt(0, 255).toString(16).padStart(2, '0');
        let g = this.nextInt(0, 255).toString(16).padStart(2, '0');
        let b = this.nextInt(0, 255).toString(16).padStart(2, '0');
        return '#' + r + g + b;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Random;
//# sourceMappingURL=index.js.map