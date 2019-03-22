"use strict";

const types = {
  'f': {
    method: 'uniform1f',
    defaultValue: 0
  },
  '2f': {
    method: 'uniform2f',
    defaultValue: [0, 0]
  },
  '3f': {
    method: 'uniform3f',
    defaultValue: [0, 0, 0]
  },
  '4f': {
    method: 'uniform4f',
    defaultValue: [0, 0, 0, 0]
  }
};

/**
 *
 * @param {WebGLRenderingContext} context
 * @param {string} vertexShaderSrc
 * @param {string} fragmentShaderSrc
 * @param {object} uniforms
 * @param {object} defines
 *
 * @constructor
 */
function Program (context, vertexShaderSrc, fragmentShaderSrc, uniforms, defines) {
  this.context = context;
  this.initialize(vertexShaderSrc, fragmentShaderSrc, uniforms, defines);
}

/**
 * Initialize the shaders and program.
 *
 * @param {string} vertexShaderSrc
 * @param {string} fragmentShaderSrc
 * @param {object} uniforms
 * @param {object} defines
 *
 * @protected
 */
Program.prototype.initialize = function (vertexShaderSrc, fragmentShaderSrc, uniforms) {
  const quality = 'highp';

  vertexShaderSrc = `#version 300 es
    precision ${quality} float;
    precision ${quality} int;

    ${vertexShaderSrc}
  `;

  fragmentShaderSrc = `#version 300 es
    precision ${quality} float;
    precision ${quality} int;
    precision ${quality} sampler2D;

    ${fragmentShaderSrc}
  `;

  this.vertexShader = this.createShader(this.context.VERTEX_SHADER, vertexShaderSrc);
  this.fragmentShader = this.createShader(this.context.FRAGMENT_SHADER, fragmentShaderSrc);
  this.program = this.context.createProgram();

  this.context.attachShader(this.program, this.vertexShader);
  this.context.attachShader(this.program, this.fragmentShader);

  this.context.linkProgram(this.program);
  //this.context.validateProgram(this.program); //throw warning in firefox on mac

  //if (!this.context.getProgramParameter(this.program, this.context.LINK_STATUS)) {
  //  throw new Error('Could not initialise shaders: ' + this.context.getProgramInfoLog(this.program));
  //}

  const uniformsKeys = Object.keys(uniforms);
  this.uniformsInfo = [];
  this.texturesInfo = [];
  let textureNumber = 0;

  for (let i = 0; i < uniformsKeys.length; i++) {
    const uniform = uniformsKeys[i];
    const type = uniforms[uniform];

    if (type === 't') {
      this.texturesInfo.push({
        id: uniform,
        textureNumber: textureNumber,
        textureUnit: this.context['TEXTURE' + textureNumber],
        location: this.context.getUniformLocation(this.program, uniform)
      });

      textureNumber++;
    } else {
      this.uniformsInfo.push({
        id: uniform,
        method: types[type].method,
        defaultValue: types[type].defaultValue,
        location: this.context.getUniformLocation(this.program, uniform)
      });
    }
  }

  this.positionAttribute = this.context.getAttribLocation(this.program, 'position');
  this.context.enableVertexAttribArray(this.positionAttribute);
};


/**
 * Create a shader.
 *
 * @param {int} type FRAGMENT_SHADER or VERTEX_SHADER
 * @param {string} src Source of the shader
 * @returns {WebGLShader}
 */
Program.prototype.createShader = function (type, src) {
  const shader = this.context.createShader(type);
  this.context.shaderSource(shader, src);
  this.context.compileShader(shader);

  if (!this.context.getShaderParameter(shader, this.context.COMPILE_STATUS)) {
    throw new Error('Error creating shader : ' + this.context.getShaderInfoLog(shader) + '\n' + src);
  }

  return shader;
};

/**
 * Retrieve the WebGLProgram.
 *
 * @returns {WebGLProgram}
 * @public
 */
Program.prototype.getProgram = function () {
  return this.program;
};

/**
 * Free the resources used for the program.
 *
 * @public
 */
Program.prototype.dispose = function () {
  this.context.deleteProgram(this.program);
  this.context.deleteShader(this.vertexShader);
  this.context.deleteShader(this.fragmentShader);

  this.program = null;
  this.vertexShader = null;
  this.fragmentShader = null;
  this.context = null;
};

module.exports = Program;