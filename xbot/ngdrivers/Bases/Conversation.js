import {abstract} from "../../framework/Decorators";
/**
 * Created by Creeplays on 29.08.2016.
 */
export default class Conversation {
    static props=['provider','forward','adapter','peer','sendPhoto','sendText','sendFile','sendAction','lock','unlock','lockTarget'];
    provider;
    forward;
    adapter;
    peer;
    constructor(provider,peer){
        this.provider=provider;
        this.peer=peer;
    }
    @abstract()
    sendPhoto(file,message,answer,options){}
    @abstract()
    sendText(message,answer,options){}
    @abstract()
    sendFile(file,message,answer,options){}
    @abstract()
    sendAction(type,options){}

    lockTarget;

    async lock(state){
        if(!this.lockTarget)
            throw new Error('Lock target is not defined!');
        this.state.lock=[...this.lockTarget,state];
        await this.state.save();
    }
    async unlock(){
        delete this.state.lock;
        await this.state.save();
    }
}