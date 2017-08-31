import {writeSync,fsyncSync} from 'fs';

// By default using writeSync and fsyncSync to log
let useStdoutFallback=false;
if(process.env.STDOUT_FALLBACK)
	useStdoutFallback=true;

export function writeStdout (string) {
	if (!useStdoutFallback) {
		try {
			writeSync(1, string);
			fsyncSync(1);
		} catch (e) {
			useStdoutFallback = true;
			writeStdout(string);
		}
	} else {
		process.stdout.write(string);
	}
}
export function writeEscape(args){
    writeStdout('\u001B[' + args);
}
export function moveCursor(line, col?) {
	writeEscape(line + ';' + (col || 1) + 'f');
}
export function hideCursor(){
    writeEscape('?25l');
}
export function showCursor(){
    writeEscape('?25h');
}
export function clearLine(line?) {
	if(line){
		save();
		moveCursor(line);
		writeEscape('2K');
		restore();
	}
	else
		writeEscape('2K');
}
export function clearScreen() {
	writeEscape('2J');
}
export function save() {
	writeEscape('s');
}
export function restore() {
	writeEscape('u');
}