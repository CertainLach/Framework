import {format} from 'util';
import Logger,{LOGGER_ACTIONS,BasicReceiver} from '@meteor-it/logger';
import * as rollbar from 'rollbar';

const ansiColors = {
	reset: [0, 0],

	bold: [1, 22],
	dim: [2, 22],
	italic: [3, 23],
	underline: [4, 24],
	inverse: [7, 27],
	hidden: [8, 28],
	strikethrough: [9, 29],

	black: [30, 39],
	red: [31, 39],
	green: [32, 39],
	yellow: [33, 39],
	blue: [34, 39],
	magenta: [35, 39],
	cyan: [36, 39],
	white: [37, 39],
	gray: [90, 39],

	bgBlack: [40, 49],
	bgRed: [41, 49],
	bgGreen: [42, 49],
	bgYellow: [43, 49],
	bgBlue: [44, 49],
	bgMagenta: [45, 49],
	bgCyan: [46, 49],
	bgWhite: [47, 49]
};

function stringifyData(data) {
	let uncolored = format(data.line, ...data.params || []).emojify();
	return uncolored.replace(/{(\/?)([^}]+)}/g, '');
}

export default class NodeRollbarReceiver extends BasicReceiver {
	nameLimit;

	constructor(rollbarToken) {
		super();
		rollbar.init(rollbarToken);
	}

	write(data) {
		data.string = `[${data.name}] `+stringifyData(data);
		switch (data.type) {
			case LOGGER_ACTIONS.IDENT:
			case LOGGER_ACTIONS.DEENT:
				break;
			case LOGGER_ACTIONS.LOG:
				rollbar.reportMessage(data.string, "info");
				break;
			case LOGGER_ACTIONS.ERROR:
				rollbar.reportMessage(data.string, "critical");
				break;
			case LOGGER_ACTIONS.WARNING:
				rollbar.reportMessage(data.string, "warning");
				break;
			case LOGGER_ACTIONS.DEBUG:
				rollbar.reportMessage(data.string, "debug");
				break;
			case LOGGER_ACTIONS.TIME_START:
				break;
			default:
				console._log(data);
		}
		// console._log(data);
	}
}
