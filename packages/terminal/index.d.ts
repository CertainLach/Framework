/**
 * Start buffer write
 */
export declare function startBuffering(): void;
/**
 * Stop buffering and write buffer to stdout
 */
export declare function flushBuffer(): void;
/**
 * Write string to stdout (or to buffer, if buffering is enabled)
 * @param string
 */
export declare function writeStdout(string: string): void;
/**
 * Wrap data to escape and write to stdout
 * @param args code
 */
export declare function writeEscape(args: string): void;
/**
 * Moves cursor to specified position
 * @param line
 * @param col
 */
export declare function moveCursor(line: number, col?: number): void;
/**
 * Hides cursor
 */
export declare function hideCursor(): void;
/**
 * Shows cursor
 */
export declare function showCursor(): void;
/**
 * Clear line
 * @param line if not defined - current line
 */
export declare function clearLine(line?: number): void;
/**
 * Clears screen
 */
export declare function clearScreen(): void;
/**
 * Saves cursor position (Only one!)
 */
export declare function save(): void;
/**
 * Restores cursor position (Only one!)
 */
export declare function restore(): void;
