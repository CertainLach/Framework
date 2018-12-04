# Meteor.Rocket
Powerfull fullstack web framework

## Features
1. Routing
2. Server Side Rendering
3. Preloading data
4. Advanced HTTP/2 support with optimizations
5. Zarbis integration

## Usage example
### server/index.ts
```ts
import Logger from '@meteor-it/logger';
import NodeReceiver from '@meteor-it/logger/receivers/node';
import XPress from '@meteor-it/xpress';
import { ServerMiddleware } from '@meteor-it/rocket';
import rocket from '../web';
import {readFile, read} from '@meteor-it/fs';

Logger.addReceiver(new NodeReceiver());
const logger = new Logger('WEB');
const xpress = new XPress(logger);

(async () => {
    logger.log('Init server');
    xpress.use(null, new ServerMiddleware(rocket, { compiledClientDir: `${__dirname}/../client`, compiledServerDir: `${__dirname}` }));
    xpress.listenHttp('0.0.0.0', 8080);
    xpress.listenHttps('0.0.0.0', 8443, {
        key: await readFile(`${__dirname}/../../key.pem`),
        cert: await readFile(`${__dirname}/../../cert.pem`)
    })
})();
```
### client/index.ts
```ts
import { initClient } from '@meteor-it/rocket';
import rocket from '../web';

initClient(rocket);
```
### web/index.ts
```ts

```