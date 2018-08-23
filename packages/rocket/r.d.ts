import { InternalRocketNode, RocketHtmlChildren } from "./internal/data";
import RocketComponent from "./RocketComponent";
export default function r<P>(tag: RocketComponent<P>, props: P, children?: RocketHtmlChildren): InternalRocketNode;
