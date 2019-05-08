import XPress from './';
import { readFile } from '../fs';
import StaticMiddleware from "./middlewares/StaticMiddleware";

const app = new XPress('test');

console.log('Test');
app.on(null, '/test', new StaticMiddleware(__dirname));

(async () => {
    app.listenHttp('0.0.0.0', 8082);
    app.listenHttps('0.0.0.0', 8081, {
        key: await readFile(`${__dirname}/__test/key.pem`),
        cert: await readFile(`${__dirname}/__test/cert.pem`)
    });
})();
