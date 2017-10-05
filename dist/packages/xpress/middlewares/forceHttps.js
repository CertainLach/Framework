"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
function createRedirectURL(hostname, url, securePort) {
    let secureHostname;
    if (securePort === 443) {
        secureHostname = hostname;
    }
    else {
        secureHostname = hostname + ':' + securePort;
    }
    return 'https://' + secureHostname + url;
}
function default_1(securePort) {
    return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        if (req.secure) {
            next();
        }
        else {
            res.redirect(createRedirectURL(req.getHeader('host'), req.url, securePort));
        }
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
;
//# sourceMappingURL=forceHttps.js.map