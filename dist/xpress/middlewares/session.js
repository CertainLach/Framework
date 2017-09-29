"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var session = require("express-session");
function default_1(store, secret, sessionField = 's') {
    let sessionParser = session({
        secret: secret,
        name: sessionField,
        resave: true,
        store,
        rolling: true,
        saveUninitialized: true,
        cookie: {
            secure: false
        }
    });
    return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        sessionParser(req, {}, function () {
            next();
        });
    });
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
;
//# sourceMappingURL=session.js.map