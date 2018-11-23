import {observer} from "mobx-react-lite";
import {Attributes, ComponentClass, FunctionComponent, ReactElement, ReactNode} from "react";
import React from 'react';
import Helmet from "./helmet/Helmet";

const component = (styles:any[],e:FunctionComponent)=>{
    return observer(e);
};



// const h = <P extends {}>(el:FunctionComponent<P> | ComponentClass<P> | string, props: Attributes & P | null, children: ReactNode[]):ReactElement<P> =>{
//
// };