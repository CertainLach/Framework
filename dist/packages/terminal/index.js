"use strict";
const fs_1 = require("fs");
let useStdoutFallback = false;
if (process.env.STDOUT_FALLBACK)
    useStdoutFallback = true;
let buffer = '';
let buffering = false;
function startBuffering() {
    buffering = true;
    buffer = '';
}
exports.startBuffering = startBuffering;
function flushBuffer() {
    buffering = false;
    writeStdout(buffer);
    buffer = '';
}
exports.flushBuffer = flushBuffer;
function writeStdout(string) {
    if (buffering) {
        buffer += string;
        return;
    }
    if (!useStdoutFallback) {
        try {
            fs_1.writeSync(1, string);
            try {
                fs_1.fsyncSync(1);
            }
            catch (e) { }
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
function writeEscape(args) {
    writeStdout('\u001B[' + args);
}
exports.writeEscape = writeEscape;
function moveCursor(line, col = 1) {
    writeEscape(line + ';' + col + 'f');
}
exports.moveCursor = moveCursor;
function hideCursor() {
    writeEscape('?25l');
}
exports.hideCursor = hideCursor;
function showCursor() {
    writeEscape('?25h');
}
exports.showCursor = showCursor;
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
function clearScreen() {
    writeEscape('2J');
}
exports.clearScreen = clearScreen;
function save() {
    writeEscape('s');
}
exports.save = save;
function restore() {
    writeEscape('u');
}
exports.restore = restore;
//# sourceMappingURL=index.js.map