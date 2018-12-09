import { Attributes, ComponentClass, FunctionComponent, ReactElement, ReactNode } from "react";
import React from "react";
import { Observer } from 'mobx-react-lite';

export type IClassList = (string|null|false)[];
export type IAttributes = {
    class?: IClassList,
    className?: string
};

type IH = {
    (el: Array<ReactNode>): ReactElement<void>,
    <P extends object>(el: FunctionComponent<P> | ComponentClass<P> | string): ReactElement<void>,
    <P extends object>(el: FunctionComponent<P> | ComponentClass<P> | string, props: Attributes & IAttributes & P): ReactElement<P>,
    <P extends object>(el: FunctionComponent<P> | ComponentClass<P> | string, children: Array<ReactNode>): ReactElement<P>,
    <P extends object>(el: FunctionComponent<P> | ComponentClass<P> | string, props: Attributes & IAttributes & P, children: Array<ReactNode>): ReactElement<P>
};

function processProps(props:IAttributes){
    if(props.class){
        props.className = props.class.filter(e=>!!e).join(' ');
        delete props.class;
    }
}
// TODO: Optimizations (use keys where applicable)
const h: IH = ((...args: any[]) => {
    if (args.length === 1) {
        if (args[0] instanceof Array) {
            return h(React.Fragment, null, args[0]);
        } else {
            return React.createElement(args[0]);
        }
    } else if (args.length === 2) {
        if (args[1] instanceof Array) {
            let el = args[1];
            while(el.length===1)el = el[0];
            return React.createElement(args[0], null, ...el);
        } else {
            if(!!args[1])
                processProps(args[1]);
            return React.createElement(args[0], args[1]);
        }
    } else {
        if(!!args[1])
            processProps(args[1]);
        let el = args[2];
        while(el.length===1)el = el[0];
        return React.createElement(args[0], args[1], ...el);
    }
}) as any;

/**
 * Fragment with the props (i.e key)
 * @param p 
 * @param el 
 */
const frag = (p: object, el: Array<ReactNode>) => {
    return h(React.Fragment, null, el);
};
/**
 * Observe a fragment of DOM tree, returning a node which will autoupdate of used store change
 * @param observee function which returns a dom tree which uses some store and rerenders on it's changes
 */
function observed(observee: () => ReactNode): ReactNode {
    return h(Observer, [observee])
}
export { h, frag, observed };