class Stats {
  constructor(compilation) {
    this.entries = compilation.entries;
    this.modules = compilation.modules;
    this.options = compilation.options;
  }
}

module.exports = Stats;
