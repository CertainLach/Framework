import * as React from 'react';
import {IDefaultStores} from '../stores';
import HelmetDataInstance from './HelmetDataInstance';
import { ChangeDispatcher } from './ChangeDispatcher';

export default class Helmet extends React.Component<IDefaultStores>{
    render(){
        if(this.props.children){
            let children:JSX.Element[]= (this.props.children instanceof Array?this.props.children:[this.props.children]) as JSX.Element[];
            let data:HelmetDataInstance = new HelmetDataInstance();
            for (const child of children) {
                if(!child)
                    continue;
                const {type,props:{children,...props}} = child;
                switch(type){
                    case 'title':
                        data.title = (children as any).children as unknown as string;
                        break;
                    case 'meta':
                        if(props!==null)
                            data.meta.push({props:props as any});
                        break;
                    case 'link':
                        if(props!==null)
                            data.link.push({props:props as any});
                        break;
                    case 'html':
                        if(props!==null)
                            data.htmlAttrs = {props:props as any};
                        break;
                    case 'body':
                        if(props!==null)
                            data.bodyAttrs = {props:props as any};
                        break;
                    case 'script':
                        data.script.push({
                            props: props as any,
                            body: children===null?null:(children as any).children as unknown as string
                        });
                        break;
                    case 'style':
                        data.style.push({
                            props: props as any,
                            body: (children as any).children as unknown as string
                        });
                        break;
                    default:
                        throw new Error(`unknown Header child: ${type}`);
                }
            }
            return <ChangeDispatcher data={data}/>
        }else{
            return null;
        }
    }
}