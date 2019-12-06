import Logger from "..";

// Console monkey-patching
// And named console support
const OTHER_LOGGER_MARK = /^\[([a-zA-Z]+)\]/;

let consoleLogger: Logger;

consoleLogger = new Logger('console');
(consoleLogger as any).___write = consoleLogger._write;
consoleLogger._write = (data: any) => {
	if (typeof data.line === 'string' && OTHER_LOGGER_MARK.test(data.line)) {
		data.name = data.line.match(OTHER_LOGGER_MARK)[1];
		data.line = data.line.replace(OTHER_LOGGER_MARK, '').trimStart();
	}
	return (consoleLogger as any).___write(data);
}
if (!(console as any)._patchedByLogger) {
	for (let method of ['log', 'error', 'warn', 'err', 'warning', 'info']) {
		(console as any)['_' + method] = (console as any)[method];
		(console as any)[method] = (...args: any[]) => (consoleLogger as any)[method](...args);
	}
	(console as any)._patchedByLogger = true;
}
