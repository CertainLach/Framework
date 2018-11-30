# AJSON
> AJSON = JSON + More data types

## Types supported
- Infinity
- -Infinity
- NaN
- RegExp
- Date
- Buffer
- undefined
- Function

## Usage
```js
import AJSON from '@meteor-it/ajson';

const a = AJSON.stringify({
    a: Infinity,
    b: -Infinity,
    c: NaN,
    d: /[a-z]+/ig,
    e: new Date(),
    f: new Buffer([0xf6,0xcf]),
    g: undefined,
    h: (a,b) => a+b;
});

const b = AJSON.parse(a);

// b will have the same props as a

```