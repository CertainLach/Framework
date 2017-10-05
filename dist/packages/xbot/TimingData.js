"use strict";
class TimingData {
    constructor() {
        this.data = [];
        this.cn = '';
        this.st = 0;
    }
    start(name) {
        this.cn = name;
        let hrTime = process.hrtime();
        this.st = hrTime[0] * 1000000000 + hrTime[1];
    }
    stop() {
        let hrTime = process.hrtime();
        let et = hrTime[0] * 1000000000 + hrTime[1];
        let cn = this.cn;
        let st = this.st;
        if (st !== 0)
            this.data.push([cn, st, et, Math.round((et - st) / 5)]);
    }
    get buffer() {
        return this.data;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TimingData;
//# sourceMappingURL=TimingData.js.map