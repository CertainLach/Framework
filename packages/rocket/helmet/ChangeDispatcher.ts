import {Component, useEffect, useState} from 'react';
import HelmetDataInstance from './HelmetDataInstance';
import useStore from "../stores/useStore";
import HelmetStore from "./HelmetStore";

export default (props:{data:HelmetDataInstance}):JSX.Element=>{
    const helmetStore = useStore(HelmetStore);
    const [added,setAdded] = useState(false);
    useEffect(()=>{
        helmetStore.forceUpdate();
        return ()=>{
            helmetStore.removeInstance(props.data);
            helmetStore.forceUpdate();
        }
    });
    if(!added){
        helmetStore.addInstance(props.data);
        helmetStore.forceUpdate();
        setAdded(true);
    }
    return null;
}