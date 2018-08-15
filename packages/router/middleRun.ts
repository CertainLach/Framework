export default function run<T>(middleware: Function | Function[]): Function {
    if (!Array.isArray(middleware)) {
        middleware = [middleware]
    }

    return parent => {
        let finalPromise;
        let index = 0;
        let isResolved = false;
        let value: T;

        const context = (parent && parent.context) || {};
        const parentKeys = parent ? Object.keys(parent) : [];
        const parentKeysLength = parentKeys.length;

        function loop() {
            if (isResolved) {
                return value;
            } else if (index >= middleware.length) {
                return parent && parent.next && parent.next()
            }

            const args: any = {context};
            for (let i = 0; i < parentKeysLength; ++i) {
                args[parentKeys[i]] = parent[parentKeys[i]]
            }

            let nextCalled = false;
            let nextResult;
            args.next = function next() {
                if (!nextCalled) {
                    nextCalled = true;
                    nextResult = loop()
                }
                return nextResult;
            };

            let stepResolve;
            const stepPromise = new Promise(resolve => {
                stepResolve = resolve
            });
            args.resolve = function resolve(val) {
                isResolved = true;
                if (stepResolve) {
                    if (arguments.length >= 1) value = val;
                    stepResolve();
                    stepResolve = null
                }
                return finalPromise
            };

            const current = middleware[index++];
            const result = current(args);
            return Promise.race([result, stepPromise]).then(args.next)
        }

        const loopPromise = Promise.resolve().then(loop);
        finalPromise = loopPromise.then(() => {
            const shouldResolveParent = isResolved && parent && parent.resolve;
            return shouldResolveParent ? parent.resolve(value) : value
        });
        return loopPromise
    }
};