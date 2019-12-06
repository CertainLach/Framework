import { asyncEach, isNodeEnvironment } from "@meteor-it/utils";
import ErrorType from "./ErrorType";

export class LoadingItem {
    /**
     * Indicates that item loading is errored
     */
    isError!: boolean;
    /**
     * If SSR - then value is string
     */
    error?: Error | string;
    errorType?: ErrorType;
    /**
     * Must be stringifyable
     */
    value?: object;
    static fromError(error: Error | string, type: ErrorType): LoadingItem {
        const item = new LoadingItem();
        item.isError = true;
        item.error = error;
        item.errorType = type;
        return item;
    }
    static fromValue(value: object): LoadingItem {
        const item = new LoadingItem();
        item.isError = false;
        item.value = value;
        return item;
    }
}

export default class PreloadStore {
    static id = '$$preload';
    /**
     * Stores async data,
     * key = unique identifier of data
     * (specified by developer which uses useAsync)
     * value = [is error, error string | data itself, needs to be valid for JSON.stringify()
     * (which is used by rehydration process)]
     */
    items: { [key: string]: LoadingItem } = {};
    /**
     * key = <see above>
     * value = resolver for <see above>
     */
    promises: { [key: string]: Promise<object> } = {};
    countOfResolvedLastRender: number = 0;
    firstTimeRender = true;
    async resolveAll() {
        if (!isNodeEnvironment()) throw new Error('this method is for node only, use .preload() on client instead');
        this.countOfResolvedLastRender = 0;
        // TODO: Use @meteor-it/queue (in case of big amount of promises)
        await asyncEach(Object.keys(this.promises), async key => {
            // Prevent race condition on async routes
            const promise = this.promises[key];
            delete this.promises[key];
            let res: LoadingItem;
            try {
                res = LoadingItem.fromValue(await promise);
            } catch (e) {
                res = LoadingItem.fromError(e.message, ErrorType.LOADING_ERROR);
            }
            this.items[key] = res;
            this.countOfResolvedLastRender++;
        });
    }
}
