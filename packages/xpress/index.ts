import XPress, { XpressRouterStream, XPressRouterContext, HttpError, Router, developerErrorPage, userErrorPage } from "./XPress";
import StaticMiddleware from "./middlewares/StaticMiddleware";
import ForceHttpsMiddleware from "./middlewares/ForceHttpsMiddleware";

export default XPress;
export { XpressRouterStream, XPressRouterContext, HttpError, Router };
export { developerErrorPage, userErrorPage };
export { StaticMiddleware, ForceHttpsMiddleware };
