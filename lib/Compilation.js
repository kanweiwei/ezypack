const { Tapable } = require("tapable");

class Compilation extends Tapable {
  constructor(compiler) {
    this.compiler = compiler;
    this.hooks = {};
  }
}

module.exports = Compilation;
