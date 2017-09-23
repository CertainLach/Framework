var session = require("express-session");

export default function (store:any, secret:string, sessionField='s') {
    let sessionParser=session({
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
    
    return async (req, res, next) => {
        sessionParser(req, {}, function(){
            next();
        });
    }
};