import { IRouterContext } from "@meteor-it/router";
import { XPressRouterContext } from "../index";

function createRedirectURL(hostname: string, url: string, securePort: number) {
    let secureHostname;
    if (securePort === 443) {
        secureHostname = hostname;
    } else {
        secureHostname = hostname + ':' + securePort;
    }
    return 'https://' + secureHostname + url;
}

export default function (securePort: number) {
    // return async ({stream,next,path}:IRouterContext<any>&XPressRouterContext) => {
    // if(stream.req..secure) {
    // next()
    // } else {
    // res.redirect(createRedirectURL(req.headers['host'] as string, req.url as string, securePort));
    // }
    // };
};