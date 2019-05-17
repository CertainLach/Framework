import Store from "../stores/store";
import { isBrowserEnvironment } from "@meteor-it/utils";

/**
 * Internal store to store styles while loading/server rendering
 * Used for isomorphic style loader
 */
export default class IsomorphicStyleLoaderStore extends Store {
    static id = '$$isoStyleLoader';
    // Not needed
    // @observable
    styles: Set<string> = new Set();
    // Not needed
    // @action
    insertCss(...style: any[]): () => void {
        if (isBrowserEnvironment()) {
            let fns = (style as any[]).map(style => style._insertCss());
            return () => fns.forEach(fn => fn());
        } else {
            style.map(style => style._getCss()).forEach(style => this.styles.add(style));
            return () => {
            };
        }
    }
}
