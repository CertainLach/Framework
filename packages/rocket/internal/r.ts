import {InternalRocketNode} from "./data";
import {createElement} from 'react';

export function _r(tag: any, props: any, children: any): InternalRocketNode {
    return <InternalRocketNode><any>createElement(tag,props,children);
}