function createRedirectURL(hostname, url, securePort) {
    let secureHostname;
    if (securePort === 443) {
        secureHostname = hostname;
    } else {
        secureHostname = hostname + ':' + securePort; 
    }
    return 'https://' + secureHostname + url;
};


export default function (securePort) {
    return async (req, res, next) => {
        if(req.secure) {
            next()
        } else {
            res.redirect(createRedirectURL(req.hostname, req.url, securePort));
        }
    }
};