import defaultStores, { IDefaultStores } from "./defaultStores";
import {ReturnType, IUninitializedStoreMap} from './utilTypes';

export default async function initStores<SM extends IUninitializedStoreMap>(sm: SM): Promise<{ [K in keyof SM]: (ReturnType<SM[K]>) } & IDefaultStores> {
    type retType = { [K in keyof SM]: (ReturnType<SM[K]>) };
    const outList: Partial<retType> = {};
    const inList = { ...(sm as {}), ...(defaultStores as {}) };
    for (let key in inList) {
        if (inList.hasOwnProperty(key)) {
            outList[key] = new ((inList as any)[key]);
            if(outList[key].init)
                await outList[key].init();
        }
    }
    return outList as { [K in keyof SM]: (ReturnType<SM[K]>) };
}
