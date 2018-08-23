import { IReactionDisposer } from 'mobx';
export declare type IStoreList = {
    [key: string]: RocketStore;
};
declare const RocketStore_base: any;
export default class RocketStore extends RocketStore_base {
    storeName: string;
    isClientSide: boolean;
    readonly isServerSide: boolean;
    dehydrationRequired: boolean;
    stores: IStoreList;
    constructor(stores: IStoreList, dehydrationRequired: boolean);
    runningAutorunDisposer: IReactionDisposer;
    autorun?(): void;
    onBeforeRehydrate(): void;
    onAfterRehydrate(): void;
    onBeforeDehydrate(): void;
    onAfterDehydrate(): void;
    onInit(): void;
    onDeinit(): void;
    setSide(isClientSide: boolean | null): void;
    dehydrate(): null | any;
    rehydrate(data: any): void;
}
