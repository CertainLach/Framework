import Vector from '../Vector';
import { Operation } from '../Operation';
import State from '../State';
export default class DoRequest {
    user: number;
    vector: Vector;
    operation: Operation;
    constructor(user: number, vector: Vector, operation: Operation);
    toString(): string;
    toHTML(): string;
    copy(): DoRequest;
    execute(state: State): this;
    transform(other: DoRequest, cid?: DoRequest): DoRequest;
    mirror(amount?: number): DoRequest;
    fold(user: number, amount: number): DoRequest;
    makeReversible(translated: DoRequest, state: State): DoRequest;
}
