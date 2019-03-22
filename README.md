# ConvChainGPU

Vanilla javascript/WebGL2 (GPU) port of [ConvChain](https://github.com/mxgmn/ConvChain).

[http://www.kchapelier.com/convchain-gpu-demo/continous-example.html](Interactive example)
[http://www.kchapelier.com/convchain-gpu-demo/simple-example-1.html](Simple example 1)
[http://www.kchapelier.com/convchain-gpu-demo/simple-example-1.html](Simple example 2)
[http://www.kchapelier.com/convchain-gpu-demo/immutable-example.html](Immutable example)

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

**convChain.setSample(sample[, sampleSize])**

Same arguments as the constructor.

**convChain.setField(fieldWidth, fieldHeight[, values])**

Resize the field at the given width and height. Initialize it at the given values if provided, otherwise fill it with random values.

 - *fieldWidth :* Width of the field, an integer greater than 3.
 - *fieldHeight :* Height of the field, an integer greater than 3.
 - *values :* Flat array containing the values to the values to inialiaze the field with.

**convChain.iterate(iterations, n, temperature[, seed])**

Iterate on and update the cells. Returns an object implementing the `getUint8Array()` method which can be used to retrieve
the field values as a flat array. This object can also be used with the internal WebGL2 context as used in some of
the examples.

 - *iterations :* Number of iterations.
 - *n :* Receptor size, an integer greater than 0.
 - *temperature :* Temperature, a float.
 - *seed :* Seed for the generation of random numbers. This is specifically used in conjunction with the temperature to decide whether one value should be modified.

### Static method

**ConvChainGPU.isSupported()**

Return whether the current environment support the features required to use ConvChainGPU.

Tests the browser support for WebGL2 and the existence of the `EXT_color_buffer_float` extension.

### Immutable cells / constraints

It is possible to set immutable cells in the field using `setField()` by passing values above 1. Any cell with a value
greater than 1 will be left as is by ConvChainGPU. Odd values (2, 4, 6, ...) are considered immutable empty values and
even values (1, 3, 5, ...) are considered immutable full values.

This feature can be used to generate a labyrinth around a hardcoded dungeon, generate a forest around a hardcoded
village, generate the inside of hardcoded houses, etc.

[http://www.kchapelier.com/convchain-gpu-demo/immutable-example.html](Immutable example)

### Implementation details

The [repository of the original implementation](https://github.com/mxgmn/ConvChain) documents how the algorithm works.
This implementation is was slightly modified in order to take advantage of the GPU.

Whereas the original implementation update one cell per iteration, here the field is divided in regions of `n` x `n`
(receptor size) and at each iterations on cells of each region is updated. For example with a field of size 30x30 and
a receptor size of 3, the field is divided in 100 regions of 3x3 and at each iteration 100 cells are updated.

## Roadmap

 * When no value is provided, initialize the field with random values on the GPU. This is currently done on the CPU. Which is an issue for large field.
 * See if it is possible to make the original vanilla js API compatible with this port, so that it can be more easily used as a fallback when the user browser doe not support WebGL2.

## Changelog

### [1.0.0](https://github.com/kchapelier/convchain-gpu/tree/1.0.0) (2019-03-22)

 * First implementation.

### License

MIT