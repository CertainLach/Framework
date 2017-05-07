/**
 * Get caller. Internal use.
 */
export function getCaller (depth = null) {
	if (depth === null) {
		depth = 1;
	} else if (depth >= 1) {
		depth--;
	}
	let _prepareStackTrace = Error.prepareStackTrace;
	Error.prepareStackTrace = (_, stack) => {
		return stack; // Instead of generating stack trace, just return stack
	};
	let err = new Error();
	let stack = err.stack;
	Error.prepareStackTrace = _prepareStackTrace;
	stack.shift(); // Error() call
	for (let i = 0; i < depth; i++) {
		stack.shift();
	}
	return new Caller(stack[0]);
}

/**
 * Internal use. Wrapper to node internal interface
 */
class Caller {
	functionName;
	fileName;
	lineNumber;
	columnNumber;
	methodName;

	constructor (stackItem) {
		this.functionName = stackItem.getFunctionName();
		this.fileName = stackItem.getFileName();
		this.lineNumber = stackItem.getLineNumber();
		this.columnNumber = stackItem.getColumnNumber();
		this.methodName = stackItem.getColumnNumber();
	}
	toReadable () {
		return `${this.fileName || 'inMemory'}: ${this.lineNumber}:${this.columnNumber} (${this.functionName || '<anonymous>'}${this.methodName ? '/' + this.methodName : ''})`;
	}
}
