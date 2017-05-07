/**
 * Created by Creeplays on 04.09.2016.
 */
const NEEDED_FIELDS=['peer','text','sender','adapter'];

export default class Message{
    adapter;
    peer;
    attachments=[];
    text;
    chat;
    sender;

    constructor(){}
    getMessage(){
        return this.text;
    }
    validate(){
        NEEDED_FIELDS.forEach(field=>{
            if(!this[field])
                throw new Error(`Invalid message: no such field: ${field}`);
        });
    }
}