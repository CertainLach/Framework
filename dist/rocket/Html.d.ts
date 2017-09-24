import RocketComponent from './RocketComponent';
import HeaderStore from './HeaderStore';
export interface IHtmlProps {
    headerStore: HeaderStore;
    jsFiles: string[];
    cssFiles: string[];
    rendered: string;
    jsInjections: string[];
}
export default class Html extends RocketComponent<IHtmlProps> {
    render(): any;
}
