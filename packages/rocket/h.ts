import {Attributes, ComponentClass, FunctionComponent, ReactElement, ReactNode} from "react";
import React from "react";

type IH = {
    <P extends object>(el:FunctionComponent<P> | ComponentClass<P> | string, props: Attributes & P):ReactElement<P>,
    <P extends object>(el:FunctionComponent<P> | ComponentClass<P> | string, children: ReactNode[]):ReactElement<P>,
    <P extends object>(el:FunctionComponent<P> | ComponentClass<P> | string, props: Attributes & P, children: ReactNode[]):ReactElement<P>
};
const h:IH = ((args:any[])=>{

}) as any;
type IFrag = {
    (children: ReactNode[]):ReactElement<void>,
    (props: Attributes, children: ReactNode[]):ReactElement<void>
}
const frag:IFrag = ((args:any[])=>{
    if(args.length === 1)
        return h(React.Fragment,null,args[0]);
    else
        return h(React.Fragment, args[0], args[1]);
}) as any;
export {h,frag};