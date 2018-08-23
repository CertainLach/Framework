import {IRouterContext} from "@meteor-it/router";
import {XPressRouterContext} from "../index";

function createRedirectURL(hostname:string, url:string, securePort:number) {
    let secureHostname;
    if (securePort === 443) {
        secureHostname = hostname;
    } else {
        secureHostname = hostname + ':' + securePort; 
    }
    return 'https://' + secureHostname + url;
}

export default function (securePort:number) {
    return async ({req,res,next,path}:IRouterContext<any>&XPressRouterContext) => {
        if(req.secure) {
            next()
        } else {
            res.redirect(createRedirectURL(req.headers['host'], req.url, securePort));
        }
    };
};