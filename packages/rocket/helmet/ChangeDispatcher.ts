import { useEffect } from 'react';
import useStore from "../stores/useStore";
import HelmetDataInstance from './HelmetDataInstance';
import HelmetStore from "./HelmetStore";

export default (props: { data: HelmetDataInstance }): JSX.Element | null => {
    const helmetStore = useStore(HelmetStore);
    useEffect(() => {
        return () => {
            helmetStore.removeInstance(props.data);
            helmetStore.forceUpdate();
        }
    });
    helmetStore.addInstance(props.data);
    helmetStore.forceUpdate();
    return null;
}
