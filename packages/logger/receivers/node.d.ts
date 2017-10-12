import { BasicReceiver } from '../';
export default class NodeConsoleReceiver extends BasicReceiver {
    nameLimit: number;
    constructor(nameLimit?: number);
    write(data: any): void;
}
