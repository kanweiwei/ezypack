const webpack = require("./lib/webpack");

const compiler = webpack(require("./webpack.config"));
compiler.run((err, stats) => {
  console.log(err, stats);
});
