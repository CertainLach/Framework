import {createVNode, VNode} from 'inferno/core/VNodes';
import RocketComponent from "./RocketComponent";
import {InternalRocketNode} from "./___internal";
import {getFlagsForElementVnode} from "inferno/core/normalization";
import VNodeFlags from "inferno-vnode-flags";

type IIProps = {[key:string]:any};
function extractProps(_props: IIProps, isHtmlElement: boolean): {
    className: string,
    props: IIProps,
    key:any,
    ref:any
} {
    let key: any = undefined;
    let ref: any = undefined;
    let className: string = undefined;
    let props:IIProps = {};
    for (const prop in _props) {
        if (!_props.hasOwnProperty(prop))
            continue;
        if (isHtmlElement && prop === 'classes')
            className = _props[prop].filter((e: string | boolean) => e !== false && e!==null).join(' ');
        else if(prop==='key')
            key=_props[prop];
        else if(prop==='ref')
            ref=_props[prop];
        else
            props[prop]=_props[prop];
    }

    return {
        props,
        className,
        key,
        ref
    }
}

export default function r<P,C>(tag: RocketComponent<P,C>, props: P, children?: C): InternalRocketNode {
    return <InternalRocketNode><any>_r(tag, props, children);
}

export function _r(tag: any, props: any, children: any): InternalRocketNode {
    const isHtmlElement = typeof tag === 'string';
    const data = extractProps(props, isHtmlElement);
    if (isHtmlElement) {
        return createVNode(getFlagsForElementVnode(tag),tag,data.className,children,data.props,data.key,data.ref);
    } else {
        return createVNode(VNodeFlags.ComponentUnknown,tag,data.className,null,{children,...data.props},data.key,data.ref)
    }
}