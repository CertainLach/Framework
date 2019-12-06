
// C = IRouterContext<any>
export type AbstractRouterContext<S> = {
    state?: S,
    next?: () => void | Promise<void>,
}

export default function middleRun<C extends AbstractRouterContext<any>>(middleware: Function | Function[]): (context: C) => () => Promise<void> {
    if (!(middleware instanceof Array)) {
        middleware = [middleware]
    }
    middleware = middleware as Function[];

    return (parent: C) => {
        const state = (parent && parent.state) || {};

        async function loop(index: number, calledFromInside: boolean, resolveOne: () => void, pres: () => void, prej: (e: Error) => void) {
            if (index >= middleware.length) return pres();
            const ctx: C = { ...parent, state };
            let nextPromise: Promise<any> | null = null;
            ctx.next = () => {
                try {
                    if (nextPromise === null) {
                        if (index >= middleware.length) return Promise.resolve();
                        else return nextPromise = loop(index, true, resolveOne, pres, prej);
                    }
                } catch (e) {
                    throw e;
                }
                return nextPromise;
            };
            const current = (middleware as Function[])[index++];
            try {
                await current(ctx);
                resolveOne();
                if (!nextPromise)
                    await ctx.next();
            } catch (e) {
                if (calledFromInside) {
                    throw e;
                } else
                    prej(e);
            }
        }

        return () => new Promise((pres, prej) => {
            let resolved = 0;

            function resolveOne() {
                resolved++;
                if (resolved === middleware.length) {
                    pres();
                }
            }

            loop(0, false, resolveOne, pres, prej);
        });
    }
};
