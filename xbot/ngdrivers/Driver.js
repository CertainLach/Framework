import Logger from "../framework/logger/Logger";
/**
 * Created by Creeplays on 28.08.2016.
 */
export default class Driver{
    logger;
    bot;
    constructor(bot,name,api){
        this.logger=new Logger(name+'driver');
        this.bot=bot;
        this.api=api;
    }
}