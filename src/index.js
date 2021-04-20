console.log("执行了");

import("./hello").then((h) => {
  h.hello();
});
