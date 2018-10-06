import IsomorphicStyleLoaderStore from '../style/IsomorphicStyleLoaderStore';
import HelmetStore from '../helmet/HelmetStore';
import RouterStore from '../router/RouterStore';

export default {
    isomorphicStyleLoader: IsomorphicStyleLoaderStore,
    helmet: HelmetStore,
    router: RouterStore
};
export type IDefaultStores = {
    isomorphicStyleLoader?: IsomorphicStyleLoaderStore,
    helmet?: HelmetStore,
    router?: RouterStore
};