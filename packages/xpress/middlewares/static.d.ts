import { IRouterContext } from '@meteor-it/router';
import { XPressRouterContext } from '../';
export default function (rootFolder: string, gzipped: boolean): ({req, res, next, path}: IRouterContext<any> & XPressRouterContext) => Promise<void>;
