import useStore from "../stores/useStore";
import IsomorphicStyleLoaderStore from "./IsomorphicStyleLoaderStore";

export default (...styles:any[])=>{
    const isomorphicStyleLoaderStore = useStore(IsomorphicStyleLoaderStore);
    isomorphicStyleLoaderStore.insertCss(...styles);
}