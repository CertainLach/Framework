import { BasicReceiver } from '../';
export default class BrowserConsoleReceiver extends BasicReceiver {
    nameLimit: any;
    constructor(nameLimit?: number);
    write(data: any): void;
}
