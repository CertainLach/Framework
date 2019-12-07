import { IRouterContext } from "@meteor-it/router";
import * as session from 'express-session';
import { XPressRouterContext } from "../index";

export default function (store: (a: any) => new (a: any) => any, storeConfig: any = {}, secret: string, sessionField = 's') {
    let sessionParser = session({
        secret: secret,
        name: sessionField,
        resave: true,
        store: new (store(session))(storeConfig),
        rolling: true,
        saveUninitialized: true,
        cookie: {
            secure: false
        }
    });

    return async ({ stream, next, path }: IRouterContext<any> & XPressRouterContext) => {
        sessionParser(stream.req as any, stream.res as any, (e: Error) => {
            if (e)
                return next(e);
            next();
        });
    };
};
