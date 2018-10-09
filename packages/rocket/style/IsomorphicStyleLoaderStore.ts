import Store from "../stores/store";

/**
 * Internal store to store styles while loading/server rendering
 * Used for isomorphic style loader
 */
export default class IsomorphicStyleLoaderStore extends Store {
    // Not needed
    // @observable
    styles: Set<string> = new Set();
    // Not needed
    // @action
    insertCss(...style: IIsomorphicStyleLoaderMethods[]): () => void {
        if (process.env.BROWSER) {
            let fns = (style as any[]).map(style => style._insertCss());
            return () => fns.forEach(fn => fn());
        } else {
            style.map(style => style._getCss()).forEach(style => this.styles.add(style));
            return () => {
            };
        }
    }
}