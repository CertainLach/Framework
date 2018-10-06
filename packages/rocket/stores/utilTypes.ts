import {IDefaultStores} from './defaultStores';
import Store from './store';

export type ReturnType<T> = T extends new (...args: any[]) => infer R ? R : any;
export type IUninitializedStoreMap = { [key: string]: new () => Store };
export type IInitializedStoreMap<SM extends IUninitializedStoreMap> = { [K in keyof SM]?: (ReturnType<SM[K]>) } & IDefaultStores;
