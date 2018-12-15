import React from 'react';
import HelmetDataInstance from './HelmetDataInstance';
import useStore from "../stores/useStore";
import HelmetStore from "./HelmetStore";

const {useEffect, useState} = React;

export default (props:{data:HelmetDataInstance}):JSX.Element=>{
    const helmetStore = useStore(HelmetStore);
    useEffect(()=>{
        return ()=>{
            helmetStore.removeInstance(props.data);
            helmetStore.forceUpdate();
        }
    });
    helmetStore.addInstance(props.data);
    helmetStore.forceUpdate();
    return null;
}