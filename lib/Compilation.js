const { Tapable, SyncHook } = require("tapable");
const path = require("path");
const Parser = require("./Parser");
const NormalModuleFactory = require("./NormalModuleFactory");

const normalModuleFactory = new NormalModuleFactory();

const parser = new Parser();
class Compilation extends Tapable {
  constructor(compiler) {
    super();
    this.compiler = compiler;
    this.context = compiler.context;
    this.options = compiler.options;
    this.inputFileSystem = compiler.inputFileSystem;
    this.outFileSystem = compiler.outFileSystem;

    this.entries = []; // 入口模块的数组
    this.modules = [];

    this.hooks = {
      succeedModule: new SyncHook(["module"]),
    };
  }

  /**
   * 从入口文件开始编译
   * @param {*} context
   * @param {*} entry
   * @param {*} name
   * @param {*} callback
   */
  addEntry(context, entry, name, callback) {
    this._addModuleChain(context, entry, name, (err, module) => {
      callback(err, module);
    });
  }

  _addModuleChain(context, entry, name, callback) {
    let entryModule = normalModuleFactory.create({
      name,
      context,
      rawRequest: entry,
      resource: path.posix.join(context, entry), // entry入口的绝对路径
      parser,
    });

    const afterBuild = function (err) {
      callback(err, entryModule);
    };

    this.buildModule(entryModule, afterBuild);

    // 当完成本次module编译后，进行保存
    this.entries.push(entryModule);
    this.modules.push(entryModule);
  }

  /**
   * 完成具体的 build 行为
   * @param {*} module
   * @param {*} callback
   */
  buildModule(module, callback) {
    module.build(this, (err) => {
      // 模块编译完成
      this.hooks.succeedModule.call(module);
      callback(err);
    });
  }
}

module.exports = Compilation;
