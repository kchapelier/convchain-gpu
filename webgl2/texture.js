"use strict";

/**
 *
 * @param {WebGLRenderingContext} context
 *
 * @constructor
 */
function Texture (context) {
  this.context = context;
  this.ready = false;
  this.floatArray = null;
}

/**
 * Initialize the texture with a loaded image.
 *
 * @param img
 */
Texture.prototype.initializeFromImage = function (img) {
  if (this.context !== null) {
    this.width = img.naturalWidth || img.width;
    this.height = img.naturalHeight || img.height;
    this.texture = this.context.createTexture();
    this.context.bindTexture(this.context.TEXTURE_2D, this.texture);
    this.context.pixelStorei(this.context.UNPACK_FLIP_Y_WEBGL, true);
    this.context.texImage2D(this.context.TEXTURE_2D, 0, this.context.RGBA, this.context.RGBA, this.context.UNSIGNED_BYTE, img);
    this.context.pixelStorei(this.context.UNPACK_FLIP_Y_WEBGL, false);

    this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_WRAP_S, this.context.CLAMP_TO_EDGE);
    this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_WRAP_T, this.context.CLAMP_TO_EDGE);
    this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_MAG_FILTER, this.context.LINEAR);
    this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_MIN_FILTER, this.context.LINEAR);

    this.context.bindTexture(this.context.TEXTURE_2D, null);
    this.ready = true;
  }
};

/**
 * Initialize the texture with an array of float values.
 *
 * @param {Float32Array} floatArray
 * @param {int} width
 * @param {int} height
 * @param {boolean} withFrameBuffer
 */
Texture.prototype.initializeFromArray = function (floatArray, width, height, withFrameBuffer) {
  if (this.context !== null) {
    this.width = width;
    this.height = height;
    this.texture = this.context.createTexture();
    this.context.bindTexture(this.context.TEXTURE_2D, this.texture);
    this.context.pixelStorei(this.context.UNPACK_FLIP_Y_WEBGL, false);
    this.context.texImage2D(this.context.TEXTURE_2D, 0, this.context.RGBA32F, this.width, this.height, 0, this.context.RGBA, this.context.FLOAT, floatArray);

    this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_WRAP_S, this.context.CLAMP_TO_EDGE);
    this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_WRAP_T, this.context.CLAMP_TO_EDGE);
    this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_MAG_FILTER, this.context.NEAREST);
    this.context.texParameteri(this.context.TEXTURE_2D, this.context.TEXTURE_MIN_FILTER, this.context.NEAREST);

    if (withFrameBuffer) {
      this.frameBuffer = this.context.createFramebuffer();
      this.context.bindFramebuffer(this.context.FRAMEBUFFER, this.frameBuffer);
      this.context.framebufferTexture2D(this.context.FRAMEBUFFER, this.context.COLOR_ATTACHMENT0, this.context.TEXTURE_2D, this.texture, 0);
      this.context.bindFramebuffer(this.context.FRAMEBUFFER, null);
    }

    this.context.bindTexture(this.context.TEXTURE_2D, null);
    this.ready = true;
  }
};

/**
 * Retrieve the result as a Uint8Array.
 *
 * @returns {Uint8Array}
 * @public
 */
Texture.prototype.getUint8Array = function () {
  const floatArrayLength = 4 * this.width * this.height;
  const floatArray = (this.floatArray && this.floatArray.length === floatArrayLength) ? this.floatArray : new Float32Array(4 * this.width * this.height);
  const resultArray = new Uint8Array(this.width * this.height);

  this.context.bindFramebuffer(this.context.FRAMEBUFFER, this.frameBuffer);
  this.context.readPixels(0, 0, this.width, this.height, this.context.RGBA, this.context.FLOAT, floatArray, 0);
  this.context.bindFramebuffer(this.context.FRAMEBUFFER, null);

  for (let i = 0; i < resultArray.length; i++) {
    resultArray[(i % this.width) + (this.height - (i / this.width | 0) - 1) * this.width] = Math.round(floatArray[i * 4]);
  }

  this.floatArray = floatArray;

  return resultArray;
};

/**
 * Check whether the texture is ready to be used.
 *
 * @returns {boolean|*}
 */
Texture.prototype.isReady = function () {
  return this.ready;
};

/**
 * Return the texture.
 *
 * @returns {WebGLTexture|null}
 */
Texture.prototype.getTexture = function () {
  return this.texture;
};

/**
 * Return the framebuffer
 *
 * @returns {WebGLFramebuffer}
 */
Texture.prototype.getFrameBuffer = function () {
  return this.frameBuffer;
};

/**
 * Free the resources used for the texture.
 *
 * @public
 */
Texture.prototype.dispose = function () {
  if (this.frameBuffer) {
    this.context.deleteFramebuffer(this.frameBuffer);
  }

  this.context.deleteTexture(this.texture);

  this.texture = null;
  this.frameBuffer = null;
  this.context = null;
};

module.exports = Texture;