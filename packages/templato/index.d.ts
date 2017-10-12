import Logger from '@meteor-it/logger';
export default class Templato {
    logger: Logger;
    languages: {};
    constructor();
    addLanguage(folder: any, family: any): Promise<void>;
}
