export default class RocketStore {
    isClientSide: boolean;
    readonly isServerSide: boolean;
    dehydrationRequired: boolean;
    constructor(dehydrationRequired: boolean);
    runningAutorun: boolean;
    autorun?(): any;
    onBeforeRehydrate(): void;
    onAfterRehydrate(): void;
    onBeforeDehydrate(): void;
    onAfterDehydrate(): void;
}
export declare type IStoreList = {
    [key: string]: RocketStore;
};
