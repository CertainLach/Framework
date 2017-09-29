import Vector from '../Vector';
import DoRequest from './Do';
import UndoRequest from './Undo';

export default class RedoRequest {
    user: number;
    vector: Vector;


    /**
     * Represents an redo request made by an user at a certain time
     * @param user 
     * @param vector The time at which the request was issued
     */
    constructor(user: number, vector:Vector) {
        this.user = user;
        this.vector = vector;
    }

    toString() {
        return `RedoRequest(${[this.user, this.vector].join(", ")})`;
    }

    toHTML() {
        return `RedoRequest(${[this.user, this.vector.toHTML()].join(", ")})`;
    }

    copy() {
        return new RedoRequest(this.user, this.vector);
    }

    /**
     * Finds the corresponding UndoRequest to this RedoRequest
     * @param log The log to search
     */
    associatedRequest(log:Array<DoRequest|UndoRequest|RedoRequest>): UndoRequest {
        let sequence = 1;
        let index = log.indexOf(this);

        if (index == -1)
            index = log.length - 1;

        for (; index >= 0; index--) {
            if (log[index] === this || log[index].user != this.user)
                continue;
            if (log[index].vector.get(this.user) > this.vector.get(this.user))
                continue;

            if (log[index] instanceof RedoRequest)
                sequence += 1;
            else
                sequence -= 1;

            if (sequence == 0)
                return <UndoRequest>log[index];
        }
    }
}