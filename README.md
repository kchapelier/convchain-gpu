# ConvChainGPU

Vanilla javascript/WebGL2 (GPU) port of [ConvChain](https://github.com/mxgmn/ConvChain).

! TODO link to examples

## Installing

With [npm](http://npmjs.org) do:

```
npm install convchain-gpu --save
```

Or with [yarn](https://yarnpkg.com) do:

```
yarn add convchain-gpu
```

## Basic example

```js
const ConvChainGPU = require('convchain-gpu');

const samplePattern = [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 0, 0, 0, 0, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 0, 0, 0, 0, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1
];

const width = 64;
const height = 32;

const convChain = new ConvChainGPU(samplePattern);

convChain.setField(width, height);

const generatedPattern = convChain.iterate(9, 3, 0.5).getUint8Array(); // a flat Uint8Array

// some code to display the result in the console
for (let y = 0; y < height; y++) {
    let s = '';
    for (let x = 0; x < width; x++) {
        s += ' ' + generatedPattern[x + y * width];
    }
    console.log(s);
}
```

## Public API

### Constructor

**new ConvChain(sample[, sampleSize])**

 - *sample :* Sample pattern as a flat array or a 2D array.
 - *sampleSize :* Indicate the width and height of the sample when used with a flat array, if omitted the sample pattern is assumed to be a square.

```js
const testSample = [
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1
]; //flat array

const convChain = new ConvChainGPU(testSample, [14, 10]);
```

```js
const testSample = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
]; //2D array

const convChain = new ConvChainGPU(testSample);
```

### Methods

! TODO document the API

### Immutable cells / constraints

It is possible to set immutable cells in the field using `setField()` by passing values above 1. Any cell with a value
greater than 1 will be left as is by ConvChainGPU. Odd values (2, 4, 6, ...) are considered immutable empty values and
even values (1, 3, 5, ...) are considered immutable full values.

This feature can be used to generate a labyrinth around a hardcoded dungeon, generate a forest around a hardcoded
village, generate the inside of hardcoded houses, etc.

! TODO link to an example

## Roadmap

 * When no value is provided, initialize the field with random values on the GPU. This is currently done on the CPU.
Which is an issue for large field.

## Changelog

### [1.0.0](https://github.com/kchapelier/convchain-gpu/tree/1.0.0) (2019-03-22)

 * First implementation.

### License

MIT