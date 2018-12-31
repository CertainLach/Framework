import React, { Attributes, ComponentClass, FunctionComponent, ReactElement, ReactNode, RefAttributes } from "react";
import { Observer } from 'mobx-react-lite';

export type IClassList = (string | null | false)[];
export type IAttributes = {
    class?: IClassList,
    className?: string
};


type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
type IH = {
    (el: ReactNode): ReactNode,

    (el: () => (ReactNode | ReactNode[]) | (new () => React.Component) | string): ReactNode,

    <P extends { [key: string]: unknown }>(el: (o: P) => (ReactNode | ReactNode[]), props: RefAttributes<any> & Attributes & IAttributes & Omit<P, 'children'>): ReactNode,
    <P extends { [key: string]: unknown }>(el: (new () => React.Component<P>), props: Attributes & IAttributes & Omit<P, 'children'>): ReactNode,
    (el: string, props: Attributes & IAttributes & any): ReactNode,

    (el: () => (ReactNode | ReactNode[]) | (new () => React.Component) | string, children: ReactNode[]): ReactNode,

    <P extends { [key: string]: unknown }>(el: (o: P) => (ReactNode | ReactNode[]), props: RefAttributes<any> & Attributes & IAttributes & Omit<P, 'children'>, children: ReactNode[]): ReactNode,
    <P extends { [key: string]: unknown }>(el: (new () => React.Component<P>), props: Attributes & IAttributes & Omit<P, 'children'>, children: ReactNode[]): ReactNode,
    (el: string, props: Attributes & IAttributes & any, children: ReactNode[]): ReactNode
};

function processProps(props: IAttributes) {
    if (props.class) {
        props.className = props.class.filter(e => !!e).join(' ');
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
            while (el.length === 1 && el[0] instanceof Array) el = el[0];
            return React.createElement(args[0], null, ...el);
        } else {
            if (!!args[1])
                processProps(args[1]);
            return React.createElement(args[0], args[1]);
        }
    } else {
        if (!!args[1])
            processProps(args[1]);
        let el = args[2];
        while (el.length === 1 && el[0] instanceof Array) el = el[0];
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
    return h(Observer as any, [observee])
}
export { h, frag, observed };
