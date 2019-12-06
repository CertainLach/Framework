import { Observer } from 'mobx-react-lite';
import React, { Component, ReactElement } from "react";

export type IClassList = (string | null | false)[];

export type IReactAttributes = {
    key?: string;
}

export type IVanillaAttributes = {
    class?: IClassList,
    className?: string
};

export type RocketElement = ReactElement<any, any> | null;

export type RocketConstructor<P> = ((props: P) => RocketElement) | (new () => Component<P>);
type IH = {
    /**
     * Fragment creator
     */
    (children: RocketElement[]): RocketElement,
    /**
     * No props version
     */
    (constructor: RocketConstructor<{}>): RocketElement,
    /**
     * Only props version
     */
    <P>(constructor: RocketConstructor<P>, props: P & IReactAttributes): RocketElement,
    /**
     * Only props for vanilla elements
     */
    <P>(constructor: string, props: P & IVanillaAttributes): RocketElement,
    /**
     * Only children version
     * Accepts only array children, to prevent ambiguity with only props version of h
     */
    <C extends Array<any>>(constructor: RocketConstructor<{ children: C }> | string, children: C): RocketElement,
    /**
     * Props&children version
     */
    <P, C>(constructor: RocketConstructor<P & { children: C }>, props: P, children: C): RocketElement,
    /**
     * Props&children version for vanilla elements
     */
    <P>(constructor: string, props: P & IVanillaAttributes, children: RocketElement[]): RocketElement,
    /**
     * Mobx observed tree creator
     */
    observed: (observee: () => RocketElement) => RocketElement,
}

function processProps(props: IVanillaAttributes) {
    if (props.class) {
        props.className = props.class.filter(e => !!e).join(' ');
        delete props.class;
    }
}

const h: IH = ((...args: any[]) => {
    if (args.length === 1) {
        if (args[0] instanceof Array) {
            return h(React.Fragment, {}, args[0]);
        } else {
            return React.createElement(args[0]);
        }
    } else if (args.length === 2) {
        if (args[1] instanceof Array) {
            let el = args[1];
            while (el.length === 1 && el[0] instanceof Array) el = el[0];
            return React.createElement(args[0], null, ...el);
        } else {
            if (args[1])
                processProps(args[1]);
            return React.createElement(args[0], args[1]);
        }
    } else {
        if (args[1])
            processProps(args[1]);
        let el = args[2];
        while (el.length === 1 && el[0] instanceof Array) el = el[0];
        return React.createElement(args[0], args[1], ...el);
    }
}) as any;

/**
 * Observe a fragment of DOM tree, returning a node which will autoupdate of used store change
 * @param observee function which returns a dom tree which uses some store and rerenders on it's changes
 */
function observed(observee: () => RocketElement): RocketElement {
    return h(Observer as any, [observee]);
}
h.observed = observed;
export { h, observed };
