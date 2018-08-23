import { BasicReceiver } from '../';
export default class BrowserConsoleReceiver extends BasicReceiver {
    nameLimit: number;
    constructor(nameLimit?: number);
    write(data: any): void;
}
