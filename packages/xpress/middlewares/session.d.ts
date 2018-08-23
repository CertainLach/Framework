import { IRouterContext } from "@meteor-it/router";
import { XPressRouterContext } from "../index";
export default function (store: any, storeConfig: any, secret: string, sessionField?: string): ({req, res, next, path}: IRouterContext<any> & XPressRouterContext) => Promise<void>;
