const path = require("path");
const types = require("@babel/types");
const generator = require("@babel/generator").default;
const traverse = require("@babel/traverse").default;

class NormalModule {
  constructor(data) {
    const { name, context, rawRequest, resource, parser } = data;
    this.name = name;
    this.context = context;
    this.rawRequest = rawRequest;
    this.resource = resource;
    this.parser = parser;

    this._source; // 存放某个模块的原地啊嘛
    this._ast; // 存放某个模块的ast语法树

    this.denpencies = [];
  }

  build(compilation, callback) {
    /**
     * 01 从文件中读取到将来需要被加载的 module 内容
     * 02 如果当前不是 js 模块， 则需要用 loader 进行处理，最终返回 js 模块
     * 03 上述的操作完成之后就可以将 js 代码转为 ast 语法树
     * 04 当前 js 模块内容可能有引用了很多其他模块，因此我们需要递归完成
     * 05 前面的完成之后，我们只需要重复执行即可
     */
    this.doBuild(compilation, (err) => {
      if (err) return callback(err);
      this._ast = this.parser.parse(this._source);
      // 转换源代码
      traverse(this._ast, {
        CallExpression: (nodePath) => {
          let node = nodePath.node;
          let source = node.source;
          if (node.callee.type === "MemberExpression") {
            if (node.callee.object.type === "CallExpression" && node.callee.object.callee.type === "Import") {
              // import("./hello") =>   __webpack_require__.e("./src/hello.js")
              let modulePath = node.callee.object.arguments[0].value;
              let moduleName = modulePath.split(path.posix.sep).pop();
              let extName = moduleName.includes(".") ? "" : ".js";
              moduleName += extName;

              let depResource = path.posix.join(path.posix.dirname(this.resource), moduleName);
              let depModuleId = "./" + path.posix.relative(this.context, depResource);

              this.denpencies.push({
                name: this.name,
                context: this.context,
                rawRequest: moduleName,
                moduleId: depModuleId,
                resource: depResource,
              });

              let callExpression = types.callExpression(types.identifier("__webpack_require__.e"), [types.stringLiteral(depModuleId)]);
              
              node.callee.object = callExpression;
              nodePath.replaceWith(node);
            }
          }
        },
      });
      this._source = generator(this._ast, this._source).code;
      callback();
    });
  }

  doBuild(compilation, callback) {
    this.getSource(compilation, (err, source) => {
      if (err) return callback(err);
      this._source = source;
      callback();
    });
  }

  getSource(compilation, callback) {
    compilation.inputFileSystem.readFile(this.resource, "utf-8", callback);
  }
}

module.exports = NormalModule;
