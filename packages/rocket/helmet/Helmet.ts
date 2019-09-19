import HelmetDataInstance from './HelmetDataInstance';
import ChangeDispatcher from './ChangeDispatcher';
import { h } from "../h";

export default (props: { children: JSX.Element[] | Element }) => {
    if (props.children && (!(props.children instanceof Array) || props.children.length > 0)) {
        let children: JSX.Element[] = (props.children instanceof Array ? props.children : [props.children]) as JSX.Element[];
        let data: HelmetDataInstance = new HelmetDataInstance();
        for (const child of children) {
            if (!child)
                continue;
            const { type, props: { children, ...props } } = child;
            switch (type) {
                case 'title':
                    data.title = children as unknown as string;
                    break;
                case 'meta':
                    if (props !== null)
                        data.meta.push({ props: props as any });
                    break;
                case 'link':
                    if (props !== null)
                        data.link.push({ props: props as any });
                    break;
                case 'html':
                    if (props !== null)
                        data.htmlAttrs = { props: props as any };
                    break;
                case 'body':
                    if (props !== null)
                        data.bodyAttrs = { props: props as any };
                    break;
                case 'script':
                    if (children !== null)
                        data.script.push({
                            props: props as any,
                            body: children.children as unknown as string
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
        return h(ChangeDispatcher, { data });
    } else {
        return null;
    }
}
