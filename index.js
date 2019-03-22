"use strict";

const Context = require('./webgl2/context');

/**
 * ConvChainGPU constructor.
 *
 * @param {Array|Uint8Array} sample Sample pattern as a flat array or a 2D array.
 * @param {int} [sampleSize] Indicate the width and height of the sample when used with a flat array, if omitted assume the sample is a square
 * @constructor
 */
function ConvChainGPU (sample, sampleSize) {
  this.context = new Context();

  this.textureWeights = null;
  this.texturesField = null;

  this.width = 16;
  this.height = 16;

  this.createProgram();
  this.setSample(sample, sampleSize);
}

/**
 * Create the program used to execute the convchain algorithm.
 *
 * @private
 */
ConvChainGPU.prototype.createProgram = function () {
  this.program = this.context.createProgram(
    `
    in vec3 position;

    void main() {
        gl_Position = vec4(position, 1.0);
    }
    `,
    `
    layout(location = 0) out vec4 fragColor;

    uniform sampler2D weights;
    uniform sampler2D field;
    uniform vec2 resolution;
    uniform float temperature;
    uniform float n;
    uniform float iteration;
    uniform float seed;

    #define rng() fract(seed * iteration * iteration * 0.1981 + 1. + sin(seed * 1453. + dot(gl_FragCoord.xy, vec2(12.9898, 4.1414 + sin(seed * 4801. + iteration*0.1393)))) * 43758.5453)
    #define pixelPicking(n,coord,frame) (mod(floor(n*n*0.5+1.)*frame, n*n) == mod(floor(coord.x), n) + mod(floor(coord.y), n) * n)

    #define getFieldValue(coord) round(mod(texelFetch(field, ivec2(coord.xy), 0).r + 0.00001, 2.))
    #define getRawFieldValue(coord) round(texelFetch(field, ivec2(coord.xy), 0).r + 0.00001)
    #define getWeightValue(index) texelFetch(weights, ivec2(mod(index, 1024.), floor((index) / 1024.)), 0).r

    float convchain (vec2 coord) {
      float q = 1.;
      float value = getRawFieldValue(coord);

      for (float syo = 1. - n; syo <= n - 1.; syo++) {
        for (float sxo = 1. - n; sxo <= n - 1.; sxo++) {
          float ind = 0.;
          float difference = 0.;

          for (float dy = 0.; dy < n; dy++) {
            for (float dx = 0.; dx < n; dx++) {
              float power = pow(2., dy * n + dx);
              vec2 ncoord = mod(coord + vec2(sxo + dx, syo + dy) + resolution.xy, resolution.xy);

              float nvalue = getFieldValue(ncoord);

              ind = ind + nvalue * power;

              if (ncoord.xy == coord.xy) {
                difference = mix(-power, power, nvalue);
              }
            }
          }

          q = q * getWeightValue(ind - difference) / getWeightValue(ind);
        }
      }

      if (value < 1.5 && pow(q, 1. / temperature) > rng()) {
        value = abs(value - 1.);
      }

      return value;
    }

    void main () {
      fragColor = pixelPicking(n, gl_FragCoord, iteration) ?
        vec4(convchain(floor(gl_FragCoord.xy)), 0., 0., 1.) :
        vec4(getRawFieldValue(floor(gl_FragCoord.xy)), 0., 0., 1.);
    }
    `,
    {
      resolution: '2f',
      weights: 't',
      field: 't',
      temperature: 'f',
      n: 'f',
      iteration: 'f',
      seed: 'f'
    }
  );
};

/**
 * Set the sample pattern
 * @param {Array|Uint8Array} sample Sample pattern as a flat array or a 2D array
 * @param {int|Array} [sampleSize] When used with a flat array indicate the width and height of the sample, if omitted assume the sample is a square
 *
 * @return {ConvChainGPU} Return self.
 */
ConvChainGPU.prototype.setSample = function (sample, sampleSize) {
  if (typeof sample[0] === 'number') {
    // assume flat array
    this.sample = sample;

    if (!sampleSize) {
      // assume square sample

      this.sampleWidth = this.sampleHeight = Math.sqrt(sample.length) | 0;
    } else {
      this.sampleWidth = typeof sampleSize === 'number' ? sampleSize : sampleSize[0];
      this.sampleHeight = typeof sampleSize === 'number' ? sampleSize : sampleSize[1];
    }
  } else {
    // assume 2D array
    this.sampleWidth = sample[0].length;
    this.sampleHeight = sample.length;

    const flatArray = new Uint8Array(this.sampleWidth * this.sampleHeight);

    for (let y = 0; y < this.sampleHeight; y++) {
      for (let x = 0; x < this.sampleWidth; x++) {
        flatArray[x + y * this.sampleWidth] = sample[y][x];
      }
    }

    this.sample = flatArray;
  }

  // invalidate cached weights
  this.cachedN = null;

  return this;
};

function processWeights (context, sample, sampleWidth, sampleHeight, n) {
  const count = (1 << (n * n));
  const width = Math.min(1024, count);
  const height = Math.max(1, count / width);
  const weights = new Float32Array(4 * width * height);

  function pattern (fn) {
    const result = new Array(n * n);

    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        result[x + y * n] = fn(x, y);
      }
    }

    return result;
  }

  function rotate (p) {
    return pattern(function (x, y) { return p[n - 1 - y + x * n]; });
  }

  function reflect (p) {
    return pattern(function (x, y) { return p[n - 1 - x + y * n]; });
  }

  function index (p) {
    let result = 0;
    let power = 1;

    for (let i = 0; i < p.length; i++) {
      result += p[p.length - 1 - i] ? power : 0;
      power *= 2;
    }

    return result;
  }

  for (let y = 0; y < sampleHeight; y++) {
    for (let x = 0; x < sampleWidth; x++) {
      const p0 = pattern(function (dx, dy) { return sample[((x + dx) % sampleWidth) + ((y + dy) % sampleHeight) * sampleWidth]; });
      const p1 = rotate(p0);
      const p2 = rotate(p1);
      const p3 = rotate(p2);
      const p4 = reflect(p0);
      const p5 = reflect(p1);
      const p6 = reflect(p2);
      const p7 = reflect(p3);

      weights[index(p0) * 4] += 1;
      weights[index(p1) * 4] += 1;
      weights[index(p2) * 4] += 1;
      weights[index(p3) * 4] += 1;
      weights[index(p4) * 4] += 1;
      weights[index(p5) * 4] += 1;
      weights[index(p6) * 4] += 1;
      weights[index(p7) * 4] += 1;
    }
  }

  for (let k = 0; k < count; k++) {
    if (weights[k * 4] <= 0) {
      weights[k * 4] = 0.1;
    }
  }

  return context.createTextureFromArray(weights, width, height, false);
}

/**
 * Get the weights for the sample pattern and the given receptor size.
 *
 * @param {int} n Receptor size, an integer in the range [2, 4].
 * @returns {Texture}
 * @private
 */
ConvChainGPU.prototype.getWeights = function (n) {
  if (n < 2 || n > 4) {
    throw new Error('ConvChainGPU: the receptor size must be in the [2, 4] range.')
  }
  // check if we have to generate new weights, otherwise return cached result
  if (this.cachedN !== n) {
    if (this.textureWeights) {
      this.textureWeights.dispose();
    }

    this.cachedN = n;
    this.textureWeights = processWeights(this.context, this.sample, this.sampleWidth, this.sampleHeight, n);
  }

  return this.textureWeights;
};

function generateBaseField (ctx, resultWidth, resultHeight) {
  const field = new Float32Array(resultWidth * resultHeight * 4);

  for (let i = 0; i < resultWidth * resultHeight; i++) {
    field[i * 4] = Math.random() < 0.5; // R
  }

  return [
    ctx.createTextureFromArray(field, resultWidth, resultHeight, true),
    ctx.createTextureFromArray(field, resultWidth, resultHeight, true)
  ];
}

/**
 * Set the field ConvChain should be applied on.
 *
 * @param {int} width Width of the field.
 * @param {int} height Height of the field.
 * @param {Uint8Array|Array} [values] Values to populate the field with.
 * @returns {ConvChainGPU} Return self.
 * @public
 */
ConvChainGPU.prototype.setField = function (width, height, values) {
  if (values && values.length !== width * height) {
    throw new Error('ConvChainGPU: Incorrect size for provided values.');
  }

  if (width < 4) {
    throw new Error('ConvChainGPU: Field width must be > 3.');
  }

  if (height < 4) {
    throw new Error('ConvChainGPU: Field height must be > 3.');
  }

  if (this.texturesField) {
    this.texturesField[0].dispose();
    this.texturesField[1].dispose();
    this.texturesField = null;
  }

  this.iteration = 0;
  this.width = width | 0;
  this.height = height | 0;

  if (values) {
    const field = new Float32Array(this.width * this.height * 4);

    for (let i = 0; i < this.width * this.height; i++) {
      field[i * 4] = Math.max(0, Math.round(values[(i % this.width) + (this.height - (i / this.width | 0) - 1) * this.width])); // R
    }

    this.texturesField = [
      this.context.createTextureFromArray(field, this.width, this.height, true),
      this.context.createTextureFromArray(field, this.width, this.height, true)
    ];
  }

  return this;
};

/**
 * Apply ConvChain on the field.
 *
 * @param {int} iterations Number of iterations to execute.
 * @param {int} n Receptor size, an integer in the range [2,4].
 * @param {float} temperature Temperature.
 * @param {float} [seed=0] Seed.
 * @returns {Texture} Generated pattern, returned as an object with the following methods : getUint8Array and getTexture.
 * @public
 */
ConvChainGPU.prototype.iterate = function (iterations, n, temperature, seed) {
  if (this.texturesField === null) {
    this.texturesField = generateBaseField(this.context, this.width, this.height);
  }

  seed = seed || 0;

  const textureWeights = this.getWeights(n);

  let frontTexture;
  let backTexture;

  for (let i = 0; i < iterations; i++) {
    frontTexture = this.texturesField[this.iteration%2];
    backTexture = this.texturesField[(this.iteration+1)%2];

    this.context.draw(
      this.program,
      {
        field: backTexture,
        weights: textureWeights,
        resolution: [this.width, this.height],
        temperature: temperature,
        n: n,
        iteration: this.iteration,
        seed: seed
      },
      frontTexture
    );

    this.iteration++;
  }

  return frontTexture;
};

/**
 * Free all the WebGL resources used by this instance.
 */
ConvChainGPU.prototype.dispose = function () {
  if (this.context) {
    if (this.texturesField) {
      this.texturesField[0].dispose();
      this.texturesField[1].dispose();
    }

    if (this.textureWeights) {
      this.textureWeights.dispose();
    }

    this.program.dispose();

    this.context.dispose();

    this.texturesField = null;
    this.context = null;
    this.textureWeights = null;
    this.program = null;
  }
};

/**
 * Returns whether the current environment supports all the feature necessary to use ConvChainGPU.
 *
 * @returns {boolean}
 */
ConvChainGPU.isSupported = function () {
  return Context.isSupported();
};

module.exports = ConvChainGPU;