import {writeSync,fsyncSync} from 'fs';

// By default using writeSync and fsyncSync to log
let useStdoutFallback=false;
if(process.env.STDOUT_FALLBACK)
	useStdoutFallback=true;

let buffer='';
let buffering=false;

/**
 * Start buffer write
 */
export function startBuffering (){
    buffering=true;
    buffer=''
}

/**
 * Stop buffering and write buffer to stdout
 */
export function flushBuffer (){
    buffering=false;
    writeStdout(buffer);
    buffer=''
}

/**
 * Write string to stdout (or to buffer, if buffering is enabled)
 * @param string 
 */
export function writeStdout (string:string) {
    if(buffering) {
        buffer += string;
        return;
    }
	if (!useStdoutFallback) {
		try {
			writeSync(1, string);
			try{fsyncSync(1);}catch(e){}
		} catch (e) {
			useStdoutFallback = true;
			writeStdout(string);
		}
	} else {
		process.stdout.write(string);
	}
}
/**
 * Wrap data to escape and write to stdout
 * @param args code
 */
export function writeEscape(args:string){
    writeStdout('\u001B[' + args);
}
/**
 * Moves cursor to specified position
 * @param line 
 * @param col
 */
export function moveCursor(line, col=1) {
	writeEscape(line + ';' + col + 'f');
}
/**
 * Hides cursor
 */
export function hideCursor(){
    writeEscape('?25l');
}
/**
 * Shows cursor
 */
export function showCursor(){
    writeEscape('?25h');
}
/**
 * Clear line
 * @param line if not defined - current line 
 */
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
/**
 * Clears screen
 */
export function clearScreen() {
	writeEscape('2J');
}
/**
 * Saves cursor position (Only one!)
 */
export function save() {
	writeEscape('s');
}
/**
 * Restores cursor position (Only one!)
 */
export function restore() {
	writeEscape('u');
}