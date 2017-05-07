import {abstract} from "../../framework/Decorators";
import Logger from "../../framework/logger/Logger";
/**
 * Created by Creeplays on 23.08.2016.
 */
export default class Api{
    name;
    logger;
    bot;
    constructor(bot,name){
        this.name=name;
        this.bot=bot;
        this.logger=new Logger(name);
    }
    @abstract
    async auth(...params){}
    @abstract
    async execute(method,params){}
}
