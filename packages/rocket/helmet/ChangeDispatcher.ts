import {useEffect, useState} from 'react';
import HelmetDataInstance from './HelmetDataInstance';
import useStore from "../stores/useStore";
import HelmetStore from "./HelmetStore";

export default (props:{data:HelmetDataInstance}):JSX.Element=>{
    const helmetStore = useStore(HelmetStore);
    const [added,setAdded] = useState(false);
    useEffect(()=>{
        helmetStore.addInstance(props.data);
        helmetStore.forceUpdate();
        return ()=>{
            helmetStore.removeInstance(props.data);
            helmetStore.forceUpdate();
        }
    });
    return null;
}