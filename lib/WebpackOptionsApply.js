const EntryOptionPlugin = require("./EntryOptionPlugin");

class WebpackOptionsApply {
  process(options, compiler) {
    // 挂载其他插件

    // 挂载入口插件
    new EntryOptionPlugin().apply(compiler);
    compiler.hooks.entryOptions.call(options.context, options.entry);
  }
}

module.exports = WebpackOptionsApply;
