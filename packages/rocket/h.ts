import {Attributes, ComponentClass, FunctionComponent, ReactElement, ReactNode} from "react";
import React from "react";

type IH = {
    <P extends object>(el:FunctionComponent<P> | ComponentClass<P> | string, props: Attributes & P):ReactElement<P>,
    <P extends object>(el:FunctionComponent<P> | ComponentClass<P> | string, children: ReactNode[]):ReactElement<P>,
    <P extends object>(el:FunctionComponent<P> | ComponentClass<P> | string, props: Attributes & P, children: ReactNode[]):ReactElement<P>
};
// TODO: Optimizations
const h:IH = ((...args:any[])=>{
    if(args.length===2){
        if(args[1] instanceof Array){
            if(args[1].length===1)
                return React.createElement(args[0],null,args[1][0]);
            return React.createElement(args[0],null,args[1]);
        }else{
            return React.createElement(args[0],args[1]);
        }
    }else{
        return React.createElement(args[0],args[1],args[2]);
    }
}) as any;
type IFrag = {
    (children: ReactNode[]):ReactElement<void>,
    (props: Attributes, children: ReactNode[]):ReactElement<void>
}
const frag:IFrag = ((...args:any[])=>{
    if(args.length === 1)
        return h(React.Fragment,null,args[0]);
    else
        return h(React.Fragment, args[0], args[1]);
}) as any;
export {h,frag};
