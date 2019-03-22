"use strict";

const Texture = require('./texture');
const Program = require('./program');

const planePositions = new Float32Array([-1, -1, 0, -1, 4, 0, 4, -1, 0]);

/**
 *
 * @constructor
 */
function Context () {
  this.canvas = document.createElement('canvas');
  this.width = this.canvas.width = this.height = this.canvas.height = 32;

  const options = {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
    premultipliedAlpha: false,
    preserveDrawingBuffer: false
  };

  this.context = this.canvas.getContext('webgl2', options);
  this.context.getExtension('EXT_color_buffer_float');

  this.context.disable(this.context.DITHER);
  this.context.disable(this.context.DEPTH_TEST);
  this.context.disable(this.context.BLEND);

  // 1x1 opaque black texture
  this.defaultTexture = this.context.createTexture();
  this.context.bindTexture(this.context.TEXTURE_2D, this.defaultTexture);
  this.context.texImage2D(this.context.TEXTURE_2D, 0, this.context.RGBA, 1, 1, 0, this.context.RGBA, this.context.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 1]));
  this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_MAG_FILTER, this.context.NEAREST);
  this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_MIN_FILTER, this.context.NEAREST);

  this.positionBuffer = this.context.createBuffer();
  this.context.bindBuffer(this.context.ARRAY_BUFFER, this.positionBuffer);
  this.context.bufferData(this.context.ARRAY_BUFFER, planePositions, this.context.STATIC_DRAW);
}

/**
 * Update the size of the canvas.
 */
Context.prototype.setCanvasSize = function (width, height) {
  this.width = this.canvas.width = width;
  this.height = this.canvas.height = height;
  this.context.viewport(0, 0, this.width, this.height);
};

/**
 * Draw using the given program.
 *
 * @param {Program} program
 * @param {object} uniforms
 * @param {Texture|null}target
 */
Context.prototype.draw = function (program, uniforms, target) {
  if (target) {
    this.context.viewport(0, 0, target.width, target.height);
    this.context.bindFramebuffer(this.context.FRAMEBUFFER, target.getFrameBuffer());
  } else {
    this.context.viewport(0, 0, this.width, this.height);
    this.context.bindFramebuffer(this.context.FRAMEBUFFER, null);
  }

  if (this.lastUsedProgram !== program) {
    this.context.useProgram(program.getProgram());
    this.lastUsedProgram = program;
  }

  for (let i = 0; i < program.uniformsInfo.length; i++) {
    const uniform = program.uniformsInfo[i];
    const typeOfValue = typeof uniforms[uniform.id];
    const uniformValue = typeOfValue === 'undefined' ? uniform.defaultValue : uniforms[uniform.id];

    this.context[uniform.method].apply(this.context, [uniform.location].concat(uniformValue));
  }

  for (let i = 0; i < program.texturesInfo.length; i++) {
    const texture = program.texturesInfo[i];
    const textureValue = uniforms[texture.id];

    this.context.activeTexture(texture.textureUnit);
    this.context.bindTexture(this.context.TEXTURE_2D, textureValue && textureValue.isReady() ? textureValue.getTexture() : this.defaultTexture);
    this.context.uniform1i(texture.location, texture.textureNumber);
  }

  this.context.vertexAttribPointer(program.positionAttribute, 3, this.context.FLOAT, false, 0, 0);

  this.context.drawArrays(this.context.TRIANGLES, 0, 3);

  this.context.finish();
};

/**
 * Load an standard texture from an url.
 *
 * @param {string} url
 *
 * @returns {Texture}
 */
Context.prototype.loadTextureImage = function(url) {
  const texture = new Texture(this.context);

  const img = document.createElement('img');
  img.onload = () => {
    texture.initializeFromImage(img);
  };
  img.src = url;

  return texture;
};

/**
 * Create a texture from an array of values.
 *
 * @param {Float32Array} floatArray
 * @param {int} width
 * @param {int} height
 * @param {boolean} withFrameBuffer
 *
 * @returns {Texture}
 */
Context.prototype.createTextureFromArray = function (floatArray, width, height, withFrameBuffer) {
  const texture = new Texture(this.context);

  texture.initializeFromArray(floatArray, width, height, withFrameBuffer);

  return texture;
};

/**
 * Create program.
 *
 * @param {string} vertexShader
 * @param {string} fragmentShader
 * @param {object} uniforms
 *
 * @returns {Program}
 */
Context.prototype.createProgram = function (vertexShader, fragmentShader, uniforms) {
  return new Program(this.context, vertexShader, fragmentShader, uniforms);
};


Context.prototype.dispose = function () {
  const loseContextExt = this.context.getExtension('WEBGL_lose_context');

  this.context.deleteBuffer(this.positionBuffer);

  if (loseContextExt) {
    loseContextExt.loseContext();
  }

  this.positionBuffer = null;
  this.context = null;
};

/**
 * Check whether WebGl is supported on the device.
 *
 * @returns {boolean}
 */
Context.isSupported = function () {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;

  const context = canvas.getContext('webgl2');
  const colorBufferFloatExt = context ? context.getExtension('EXT_color_buffer_float') : null;
  const loseContextExt = context ? context.getExtension('WEBGL_lose_context') : null;

  const success = !!context && !!colorBufferFloatExt;

  if (loseContextExt) {
    loseContextExt.loseContext();
  }

  return success;
};

module.exports = Context;