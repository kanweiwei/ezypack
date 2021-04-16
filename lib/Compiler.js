const { Tapable, AsyncSeriesHook, SyncHook, AsyncParallelHook, SyncBailHook } = require("tapable");
const Compilation = require("./Compilation");

class Compiler extends Tapable {
  constructor(context) {
    super();
    this.hooks = {
      done: new AsyncSeriesHook(["stats"]),
      /** @type {AsyncSeriesHook<Compiler>} */
      beforeRun: new AsyncSeriesHook(["compiler"]),
      /** @type {AsyncSeriesHook<Compiler>} */
      run: new AsyncSeriesHook(["compiler"]),
      /** @type {AsyncSeriesHook<CompilationParams>} */
      beforeCompile: new AsyncSeriesHook(["params"]),
      /** @type {SyncHook<CompilationParams>} */
      compile: new SyncHook(["params"]),
      /** @type {AsyncParallelHook<Compilation>} */
      make: new AsyncParallelHook(["compilation"]),
      /** @type {AsyncSeriesHook<Compilation>} */
      afterCompile: new AsyncSeriesHook(["compilation"]),

      entryOption: new SyncBailHook(["context", "entry"]),
    };

    this.context = context;
  }

  run(callback) {
    if (this.running) return callback(new Error("已经运行了"));

    this.running = true;

    console.log("开始run");

    const finalCallback = function (err, stats) {
      callback(err, stats);
    };

    const onCompiled = function (err, compilation) {
      finalCallback(null, {
        toJson() {
          return {
            entries: [], // 入口信息
            chunks: [], // chunk信息
            modules: [], // 模块信息
            assets: [], // 最终资源
          };
        },
      });
    };

    this.hooks.beforeRun.callAsync(this, (err) => {
      this.hooks.run.callAsync(this, (err) => {
        this.compile(onCompiled);
      });
    });
  }

  compile(callback) {
    const params = this.newCompilationParams();
    this.hooks.beforeCompile.callAsync(params, (err) => {
      if (err) return callback(err);
      this.hooks.compile.call(params);

      const compilation = this.newCompilation(params);

      this.hooks.make.callAsync(compilation, (err) => {
        if (err) return callback(err);
        console.log("make 钩子监听触发了");
        callback(null, compilation);
      });
    });
  }

  newCompilationParams() {
    const params = {
      normalModuleFactory: new NormalModuleFactory(),
    };

    return params;
  }

  newCompilation(params) {
    return new Compilation(this);
  }
}

module.exports = Compiler;
