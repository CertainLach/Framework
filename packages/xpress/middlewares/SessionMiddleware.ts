import { IRouterContext } from "@meteor-it/router";
import * as session from 'express-session';
import { XPressRouterContext } from "../index";

export default function <C>(store: () => new (config: C) => session.Store, storeConfig: C, secret: string, sessionField = 's') {
    let sessionParser = session({
        secret: secret,
        name: sessionField,
        resave: true,
        store: new (store())(storeConfig),
        rolling: true,
        saveUninitialized: true,
        cookie: {
            secure: false
        }
    });

    return async ({ stream, next }: IRouterContext<any> & XPressRouterContext) => {
        sessionParser(stream.req as any, stream.res as any, (e: any) => {
            if (e) {
                if (e instanceof Error) {
                    return next(e);
                } else {
                    return next(new Error(e));
                }
            }
            next();
        });
    };
};
