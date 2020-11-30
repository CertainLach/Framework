import { IRouterContext, RoutingMiddleware } from "@meteor-it/router";
import * as http2 from 'http2';
import { XPressRouterContext } from "../index";

function createRedirectURL(hostname: string, url: string, securePort: number) {
    if (hostname.includes(':')) hostname = hostname.slice(0, hostname.indexOf(':'));
    let secureHostname;
    if (securePort === 443) {
        secureHostname = hostname;
    } else {
        secureHostname = hostname + ':' + securePort;
    }
    return 'https://' + secureHostname + url;
}

export default class ForceHttpsMiddleware extends RoutingMiddleware<XPressRouterContext, void, any> {
    securePort: number;
    constructor(securePort: number) {
        super();
        this.securePort = securePort;
    }
    async handle({ stream }: XPressRouterContext & IRouterContext<void, any>): Promise<void> {
        if (stream.isSecure)
            return
        stream.resHeaders[http2.constants.HTTP2_HEADER_LOCATION] = createRedirectURL(stream.reqHeaders[http2.constants.HTTP2_HEADER_HOST] as string, stream.req!.url, this.securePort);
        stream.status(301);
        stream.send('Redirecting to https');
    }
}
