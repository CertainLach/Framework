(function (dependencies, factory) {
    if (typeof module === 'object' && typeof module.exports === 'object') {
        var v = factory(require, exports); if (v !== undefined) module.exports = v;
    }
    else if (typeof define === 'function' && define.amd) {
        define(dependencies, factory);
    }
})(["require", "exports", "fs"], function (require, exports) {
    "use strict";
    var fs_1 = require("fs");
    // By default using writeSync and fsyncSync to log
    var useStdoutFallback = false;
    if (process.env.STDOUT_FALLBACK)
        useStdoutFallback = true;
    var buffer = '';
    var buffering = false;
    /**
     * Start buffer write
     */
    function startBuffering() {
        buffering = true;
    }
    exports.startBuffering = startBuffering;
    /**
     * Stop buffering and write buffer to stdout
     */
    function flushBuffer() {
        buffering = false;
        writeStdout(buffer);
    }
    exports.flushBuffer = flushBuffer;
    /**
     * Write string to stdout (or to buffer, if buffering is enabled)
     * @param string
     */
    function writeStdout(string) {
        if (buffering) {
            buffer += string;
            return;
        }
        if (!useStdoutFallback) {
            try {
                fs_1.writeSync(1, string);
                fs_1.fsyncSync(1);
            }
            catch (e) {
                useStdoutFallback = true;
                writeStdout(string);
            }
        }
        else {
            process.stdout.write(string);
        }
    }
    exports.writeStdout = writeStdout;
    /**
     * Wrap data to escape and write to stdout
     * @param args code
     */
    function writeEscape(args) {
        writeStdout('\u001B[' + args);
    }
    exports.writeEscape = writeEscape;
    /**
     * Moves cursor to specified position
     * @param line
     * @param col
     */
    function moveCursor(line, col) {
        if (col === void 0) { col = 1; }
        writeEscape(line + ';' + col + 'f');
    }
    exports.moveCursor = moveCursor;
    /**
     * Hides cursor
     */
    function hideCursor() {
        writeEscape('?25l');
    }
    exports.hideCursor = hideCursor;
    /**
     * Shows cursor
     */
    function showCursor() {
        writeEscape('?25h');
    }
    exports.showCursor = showCursor;
    /**
     * Clear line
     * @param line if not defined - current line
     */
    function clearLine(line) {
        if (line) {
            save();
            moveCursor(line);
            writeEscape('2K');
            restore();
        }
        else
            writeEscape('2K');
    }
    exports.clearLine = clearLine;
    /**
     * Clears screen
     */
    function clearScreen() {
        writeEscape('2J');
    }
    exports.clearScreen = clearScreen;
    /**
     * Saves cursor position (Only one!)
     */
    function save() {
        writeEscape('s');
    }
    exports.save = save;
    /**
     * Restores cursor position (Only one!)
     */
    function restore() {
        writeEscape('u');
    }
    exports.restore = restore;
});
//# sourceMappingURL=index.js.map