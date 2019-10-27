import Logger from '@meteor-it/logger';

const queueLogger = new Logger('queue');

type IQueueItem<I, O> = {
    data: I;
    reject: (e: Error) => void;
    resolve: (out: O) => void;
}

export interface IQueueProcessor<I, O> {
    runTask(data: I): Promise<O>;
}

/**
 * Can be used for rate-limited apis
 */
export abstract class QueueProcessor<I, O> implements IQueueProcessor<I, O>{
    private busy: boolean = false;
    private queued: IQueueItem<I, O>[] = [];
    private time: number;

    protected constructor(time: number) {
        this.time = time;
        this.boundProcessLoop = this.processLoop.bind(this);
    }

    protected abstract executor(data: I): Promise<O | Error>;
    public runTask(data: I): Promise<O> {
        return new Promise((resolve, reject) => {
            this.queued.push({
                reject,
                resolve,
                data
            });
            if (!this.busy) {
                this.busy = true;
                // noinspection JSIgnoredPromiseFromCall
                this.processLoop();
            }
        });
    }

    private readonly boundProcessLoop: () => Promise<void>;
    private async processLoop() {
        this.busy = true;
        if (this.queued.length === 0) {
            this.busy = false;
            return;
        }
        let startTime = Date.now();

        let task = this.queued.shift()!;
        try {
            let data = await this.executor(task.data);
            // noinspection SuspiciousInstanceOfGuard
            if (data instanceof Error)
                task.reject(data);
            else
                task.resolve(data);
        } catch (e) {
            task.reject(e);
        }

        if (this.queued.length > 0) {
            let nowTime = Date.now();
            let timeLeftToSleep = startTime + this.time - nowTime;
            if (timeLeftToSleep <= 1)
                setTimeout(this.boundProcessLoop, 1);
            else
                setTimeout(this.boundProcessLoop, timeLeftToSleep);
        } else {
            this.busy = false;
        }
    }
}

/**
 * Can be used for some rate-limited apis, where
 * u can request data for multiple users in a time for example
 */
export abstract class CollapseQueueProcessor<I, O> implements IQueueProcessor<I, O>{
    private busy: boolean = false;
    private queued: IQueueItem<I, O>[] = [];
    private readonly tasksPerTime: number;
    private time: number;
    private waitSameTick: boolean | number;

    protected constructor(time: number, tasksPerTime: number, waitSameTick: boolean | number) {
        if (tasksPerTime === 1)
            throw new Error('CollapseQueueProcessor is for multiple tasks running in time, but you specified only 1.');
        this.time = time;
        this.tasksPerTime = tasksPerTime;
        this.waitSameTick = waitSameTick;
        this.boundProcessLoop = this.processLoop.bind(this);
    }

    protected abstract collapser(data: I[]): Promise<(O | Error)[]>;
    public runTask(data: I): Promise<O> {
        return new Promise((resolve, reject) => {
            this.queued.push({
                reject,
                resolve,
                data
            });
            if (!this.busy) {
                this.busy = true;
                // If multiple tasks will be pushed in same tick - then them
                // will be collapsed
                if (this.waitSameTick === true) {
                    process.nextTick(this.boundProcessLoop);
                } else if (this.waitSameTick !== false) {
                    if (this.waitSameTick === 0) {
                        setImmediate(this.boundProcessLoop);
                    } else if (this.waitSameTick < 0) {
                        throw new Error('waitSameTick must be >= 0')
                    } else {
                        setTimeout(this.boundProcessLoop, this.waitSameTick);
                    }
                } else {
                    // noinspection JSIgnoredPromiseFromCall
                    this.processLoop();
                }
            }
        });
    }

    private readonly boundProcessLoop: () => Promise<void>;
    private async processLoop() {
        this.busy = true;
        if (this.queued.length === 0) {
            this.busy = false;
            return;
        }
        let startTime = Date.now();
        let willBeExecuted: IQueueItem<I, O>[] = this.queued.slice(0, this.tasksPerTime);
        // Immutable queue
        this.queued = this.queued.slice(this.tasksPerTime);
        let multiExecuted: I[] = willBeExecuted.map(task => task.data);
        try {
            let returns: (O | Error)[] = await this.collapser(multiExecuted);
            if (returns.length !== willBeExecuted.length) {
                // noinspection ExceptionCaughtLocallyJS
                throw new Error('Collapser returned wrong data array! (Length mismatch)');
            }
            willBeExecuted.map((task, id) => {
                let ret = returns[id];
                // noinspection SuspiciousInstanceOfGuard
                if (ret instanceof Error)
                    task.reject(ret);
                else
                    task.resolve(ret);
            });
        } catch (e) {
            willBeExecuted.forEach(task => task.reject(e));
        }
        if (this.queued.length > 0) {
            let nowTime = Date.now();
            let timeLeftToSleep = startTime + this.time - nowTime;
            if (timeLeftToSleep <= 1)
                setTimeout(this.boundProcessLoop, 1);
            else
                setTimeout(this.boundProcessLoop, timeLeftToSleep);
        } else {
            this.busy = false;
        }
    }
}
