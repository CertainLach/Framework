import { IRouterContext } from "@meteor-it/router";
import { XPressRouterContext } from "../index";
export default function (securePort: number): ({req, res, next, path}: IRouterContext<any> & XPressRouterContext) => Promise<void>;
