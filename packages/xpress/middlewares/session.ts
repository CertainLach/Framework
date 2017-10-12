var session = require("express-session");

export default function (store:any, storeConfig:any={}, secret:string, sessionField='s') {
    let sessionParser=session({
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
    
    return (req, res, next) => {
        sessionParser(req, res, e=> {
            if(e)
                return next(e);
            next();
        });
    }
};