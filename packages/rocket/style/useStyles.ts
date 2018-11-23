import {Component, useEffect} from 'react';
import * as React from 'react';
import useStore from "../stores/useStore";
import IsomorphicStyleLoaderStore from "./IsomorphicStyleLoaderStore";

export default (...styles:any[])=>{
    const isomorphicStyleLoaderStore = useStore(IsomorphicStyleLoaderStore);
    useEffect(()=>{
        isomorphicStyleLoaderStore.insertCss(...styles);
        return ()=>{
            // TODO: Cleanup css? No-op in isomorphic-style-loader repo
        }
    });
}