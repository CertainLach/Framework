var session = require("express-session");
export default function (store, storeConfig, secret, sessionField) {
    if (storeConfig === void 0) { storeConfig = {}; }
    if (sessionField === void 0) { sessionField = 's'; }
    var sessionParser = session({
        secret: secret,
        name: sessionField,
        resave: true,
        store: new (store(session))(storeConfig),
        rolling: true,
        saveUninitialized: true,
        cookie: {
            secure: false
        }
    });
    return function (req, res, next) {
        sessionParser(req, res, function (e) {
            if (e)
                console.log(e.stack);
            next();
        });
    };
}
;
//# sourceMappingURL=session.js.map