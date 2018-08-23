import { InternalRocketNode, IRocketPassedHtmlProps, RocketComponentReactEventsProxy } from "./internal/data";
/**
 * Dirty hack to prevent usage of normal react methods (Prefer RocketComponent ones)
 */
export default abstract class RocketComponent<P> extends RocketComponentReactEventsProxy<P> {
    abstract render(): InternalRocketNode | InternalRocketNode[] | string | null;
    props: P & IRocketPassedHtmlProps;
    constructor(props?: P);
}
