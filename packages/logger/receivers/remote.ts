import { BasicReceiver, LoggerAction } from "../";
import PotatoSocketClient from "@meteor-it/socket/integrations/PotatoWebSocketClient";
import MsgPackEncoder from "@meteor-it/socket/encoders/MsgPackEncoder";

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
