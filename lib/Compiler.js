const { Tapable, AsyncSeriesHook, SyncHook, AsyncParallelHook, SyncBailHook } = require("tapable");
const Compilation = require("./Compilation");
const NormalModuleFactory = require("./NormalModuleFactory");
const Stats = require("./Stats");

class Compiler extends Tapable {
  constructor(context) {
    super();
    this.hooks = {
      done: new AsyncSeriesHook(["stats"]),
      /** @type {AsyncSeriesHook<Compiler>} */
      beforeRun: new AsyncSeriesHook(["compiler"]),
      /** @type {AsyncSeriesHook<Compiler>} */
      run: new AsyncSeriesHook(["compiler"]),

      /** @type {SyncHook<Compilation, CompilationParams>} */
      thisCompilation: new SyncHook(["compilation", "params"]),
      /** @type {SyncHook<Compilation, CompilationParams>} */
      compilation: new SyncHook(["compilation", "params"]),

      /** @type {AsyncSeriesHook<CompilationParams>} */
      beforeCompile: new AsyncSeriesHook(["params"]),
      /** @type {SyncHook<CompilationParams>} */
      compile: new SyncHook(["params"]),
      /** @type {AsyncParallelHook<Compilation>} */
      make: new AsyncParallelHook(["compilation"]),
      /** @type {AsyncSeriesHook<Compilation>} */
      afterCompile: new AsyncSeriesHook(["compilation"]),

      entryOptions: new SyncBailHook(["context", "entry"]),
    };

    this.context = context;
  }

  run(callback) {
    if (this.running) return callback(new Error("已经运行了"));

    this.running = true;

    const finalCallback = function (err, stats) {
      callback(err, stats);
    };

    const onCompiled = function (err, compilation) {
      finalCallback(null, new Stats(compilation));
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
      // 开始编译 -> compilation.addEntry
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
    const compilation = this.createCompilation();
    this.hooks.thisCompilation.call(compilation, params);
    this.hooks.compilation.call(compilation, params);
    return compilation;
  }

  createCompilation() {
    return new Compilation(this);
  }
}

module.exports = Compiler;
