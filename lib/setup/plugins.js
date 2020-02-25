'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var npm = Promise.promisifyAll(require('npm'));
var path = require('path');

/**
 * Get a list of all global npm modules.
 *
 * @private
 * @function setup.plugins.~modules
 * @return {Promise} Promise that resolves to a list of plugins.
 */
var modules = function() {
  return Promise.resolve()
  .then(function() { return npm.loadAsync(); })
  .then(function(_npm) {
    _npm.config.set('spin', false);
    _npm.config.set('global', true);
    _npm.config.set('depth', 0);
    return Promise.promisify(_npm.commands.list)([], true);
  })
  .then(function(data) { return data; });
};

/**
 * Get all installed plugins by looking at npm's list of globally installed
 * modules and finding those that match `avn-{name}`. The resulting promise
 * resolves to an object with the properties: `name`, `moduleName`, and `path`.
 *
 * @private
 * @function setup.plugins.installed
 * @return {Promise} Promise that resolves to a list of globally installed /
 * plugins.
 */
module.exports.installed = function() {
  return Promise.resolve()
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
