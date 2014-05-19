var Path = require("path");

[ "control", "interface", "model", "mw" ].forEach(function(collection) {
  exports[collection] = function(module) {
    return require(Path.join(__dirname, "lib", collection, module));
  };
});
