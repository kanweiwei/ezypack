const SingleEntryPlugin = require("./SingleEntryPlugin");

function itemToPlugin(context, entry, name) {
  return new SingleEntryPlugin(context, entry, name);
}

class EntryOptionPlugin {
  apply(compiler) {
    compiler.hooks.entryOptions.tap("EntryOptionPlugin", (context, entry) => {
      itemToPlugin(context, entry, "main").apply(compiler);
    });
  }
}

module.exports = EntryOptionPlugin;
