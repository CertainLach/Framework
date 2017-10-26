import React,{ComponentClass, StatelessComponent,HTMLAttributes,ReactHTML,ClassAttributes,ReactNode,DetailedReactHTMLElement} from 'react'; 
import RocketComponent from './RocketComponent';

export type IClassList = {[key:string]:boolean};

function omitProps(obj:any, ...remove:string[]) {
  var result = {};
  for (var prop in obj) {
    if (!obj.hasOwnProperty || obj.hasOwnProperty(prop)) {
      if (remove.indexOf(prop) === -1) {
        result[prop] = obj[prop];
      }
    }
  }
  return result;
}

export type RocketComponentConstructor<P> = new ()=>RocketComponent<P>;
export type ReactComponentConstructor<P,S> = new ()=>ComponentClass<P>;
export type ReactStatelessComponentConstructor<P,S> = new ()=>StatelessComponent<P>;
export type ElementLike = Element|string|null;

export interface IAttributes {
  key?: string|number;
  class?: {[key:string]:boolean};
  //children?: Element[]|RocketComponentConstructor<any>[]|ReactComponentConstructor<any,any>[]|StatelessComponent<any>[]
}

export function r<P>(
  type:string|Element|RocketComponentConstructor<P>|ReactComponentConstructor<P,any>|StatelessComponent<P>, 
  props:(P|any)&IAttributes, 
  ...children:Array<ElementLike>):Element {
  return _r(type,props,...children);
}

function _r(component:any, properties:any, ...children:any[]):any {
  if (component === null) {
    return null;
  }

  while(Array.isArray(children)&&children.length===1)
    children=children[0];

  let className=null;
  if(properties.class){
    properties.className=Object.keys(properties.class).filter(e=>!!properties.class[e]).join(' ');
    delete properties.class;
  }
  if(Array.isArray(children)){
    return React.createElement(component as any, properties, ...children);
  }else{
    return React.createElement(component as any, properties, children);
  }
}