"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const inferno_1 = require("inferno");
const HelmetDataInstance_1 = require("./HelmetDataInstance");
const ChangeDispatcher_1 = require("./ChangeDispatcher");
class Helmet extends inferno_1.Component {
    render() {
        if (this.props.children) {
            let children = (this.props.children instanceof Array ? this.props.children : [this.props.children]);
            let data = new HelmetDataInstance_1.default();
            for (const child of children) {
                if (!child)
                    continue;
                const { type, children, props } = child;
                switch (type) {
                    case 'title':
                        data.title = children.children;
                        break;
                    case 'meta':
                        if (props !== null)
                            data.meta.push({ props: props });
                        break;
                    case 'link':
                        if (props !== null)
                            data.link.push({ props: props });
                        break;
                    case 'html':
                        if (props !== null)
                            data.htmlAttrs = { props: props };
                        break;
                    case 'body':
                        if (props !== null)
                            data.bodyAttrs = { props: props };
                        break;
                    case 'script':
                        data.script.push({
                            props: props,
                            body: children === null ? null : children.children
                        });
                        break;
                    case 'style':
                        data.style.push({
                            props: props,
                            body: children.children
                        });
                        break;
                    default:
                        throw new Error(`unknown Header child: ${type}`);
                }
            }
            return <ChangeDispatcher_1.ChangeDispatcher data={data}/>;
        }
        else {
            return null;
        }
    }
}
exports.default = Helmet;
//# sourceMappingURL=Helmet.jsx.map