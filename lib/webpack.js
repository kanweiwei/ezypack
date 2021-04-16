const Compiler = require("./Compiler");
const NodeEnvironmentPlugin = require("./node/NodeEnvironmentPlugin");
const WebpackOptionsApply = require("./WebpackOptionsApply");

const webpack = function (options, callback) {
  let compiler = new Compiler(options.context);
  compiler.options = options;

  new NodeEnvironmentPlugin().apply(compiler);

  if (options.plugins && Array.isArray(options.plugins)) {
    for (const plugin of options.plugins) {
      plugin.apply(compiler);
    }
  }
  // 挂载所有的内置插件
  compiler.options = new WebpackOptionsApply().process(options, compiler);

  if (options.watch === true || (Array.isArray(options) && options.some((o) => o.watch))) {
    const watchOptions = Array.isArray(options) ? options.map((o) => o.watchOptions || {}) : options.watchOptions || {};
    return compiler.watch(watchOptions, callback);
  }
  compiler.run(callback);
};
