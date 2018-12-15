import Logger, { BasicReceiver, LoggerAction } from "@meteor-it/logger";
import PotatoSocketClient from "packages/socket/integrations/PotatoWebSocketClient";
import MsgPackEncoder from "packages/socket/encoders/MsgPackEncoder";

export default class RemoteReceiver extends BasicReceiver {
	socket: PotatoSocketClient;
	constructor() {
		super();
		this.socket = new PotatoSocketClient('RemoteReceiver', new MsgPackEncoder(), "ws://localhost:8083", 100);
	}
	write(e: LoggerAction) {
		this.socket.emit('line', e);
	}
}
