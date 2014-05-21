var _ = require('lodash');
var q = require('q');
var npm = require('npm');
var path = require('path');

var modules = function() {
  return q()
  .then(function() { return q.ninvoke(npm, 'load'); })
  .then(function(npm) {
    npm.config.set('global', true);
    npm.config.set('depth', 0);
    return q.nfcall(npm.commands.list, [], true);
  })
  .spread(function(data) { return data; });
};

module.exports.installed = function() {
  return q()
  .then(function() { return modules(); })
  .then(function(data) {
    return _(data.dependencies)
    .keys()
    .filter(function(module) {
      return module.match(/^avn-/);
    })
    .map(function(module) {
      var name = module.slice('avn-'.length);
      var location = path.join(data.path, 'node_modules', module);
      return { name: name, moduleName: module, path: location };
    })
    .value();
  });
};
