import { BasicReceiver } from '../';
export default class NodeConsoleReceiver extends BasicReceiver {
    nameLimit: any;
    constructor(nameLimit?: number);
    write(data: any): void;
}
