# Logger
Awesome logger for node.js

## Usage
```js
import Logger from '@meteor-it/logger';
// Logger doesn't writes anything to console itself, it needs to have at least one receiver
import NodeReceiver from '@meteor-it/logger/receivers/node';

Logger.addReceiver(new NodeReceiver());
```