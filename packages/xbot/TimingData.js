var TimingData = /** @class */ (function () {
    /**
     * Used to save timings between bot events
     */
    function TimingData() {
        this.data = [];
        this.cn = '';
        this.st = 0;
    }
    /**
     * New timing
     */
    TimingData.prototype.start = function (name) {
        this.cn = name;
        var hrTime = process.hrtime();
        this.st = hrTime[0] * 1000000000 + hrTime[1];
    };
    /**
     * Stop timing and write to buffer
     */
    TimingData.prototype.stop = function () {
        var hrTime = process.hrtime();
        var et = hrTime[0] * 1000000000 + hrTime[1];
        var cn = this.cn;
        var st = this.st;
        if (st !== 0)
            this.data.push([cn, st, et, Math.round((et - st) / 5)]);
    };
    Object.defineProperty(TimingData.prototype, "buffer", {
        get: function () {
            return this.data;
        },
        enumerable: true,
        configurable: true
    });
    return TimingData;
}());
export default TimingData;
//# sourceMappingURL=TimingData.js.map