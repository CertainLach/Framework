let TO_PRELOAD: (() => Promise<any>)[] = [];

/**
 * Preloads all declared loadable components in app
 * Used in ssr internally
 */
export async function preloadAll() {
    if (!process.env.NODE) throw new Error('preloadAll() is only available on server. You can use loadable.preload() on client');
    let toPreload = TO_PRELOAD;
    TO_PRELOAD = [];
    await Promise.all(toPreload.map(e => e()));
}
export default TO_PRELOAD;
