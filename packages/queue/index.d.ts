export interface IQueueProcessor<I, O> {
    runTask(data: I): Promise<O>;
}
/**
 * Can be used for rate-limited apis
 */
export declare abstract class QueueProcessor<I, O> implements IQueueProcessor<I, O> {
    private busy;
    private queued;
    private time;
    protected constructor(time: number);
    protected abstract executor(data: I): Promise<O | Error>;
    runTask(data: I): Promise<O>;
    private readonly boundProcessLoop;
    private processLoop();
}
/**
 * Can be used for some rate-limited apis, where
 * u can request data for multiple users in a time for example
 */
export declare abstract class CollapseQueueProcessor<I, O> implements IQueueProcessor<I, O> {
    private busy;
    private queued;
    private readonly tasksPerTime;
    private time;
    protected constructor(time: number, tasksPerTime: number);
    protected abstract collapser(data: I[]): Promise<(O | Error)[]>;
    runTask(data: I): Promise<O>;
    private readonly boundProcessLoop;
    private processLoop();
}
