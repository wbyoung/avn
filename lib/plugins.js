var path = require('path');
var util = require('util');
var fs = require('fs');
var q = require('q');
var _ = require('lodash');

/**
 * Get all installed plugins.
 *
 * @return all plugin modules ordered by the preferences in the ~/.avnrc
 * configuration file.
 */
exports.all = (function() {
  var loaded;
  var load = function() {
    // look at ~/.avnrc file to get the order of plugins, but fall back on a
    // default order if there's no config.
    var file = path.join(process.env.HOME, '.avnrc');
    var contents = fs.existsSync(file) && fs.readFileSync(file);
    var config = contents && JSON.parse(contents) || {};
    var order = _.union(config.plugins, ['nvm', 'n']);
    return order.reduce(function(array, name) {
      try { array.push(require('avn-' + name)); }
      catch (e) { rethrowUnlessFailedRequire('avn-' + name, e); }
      return array;
    }, []);
  };
  return function() {
    return loaded || (loaded = load());
  };
})();

/**
 * Get the first plugin matching a predicate.
 *
 * @param {fn} predicate - a function that takes one argument, the plugin
 * and returns a truthful value (or a promise that resolves to a truthful
 * value).
 * @return {promise} a promise that resolves to the plugin that resulted in a
 * successful evaluation of the predicate. if no predicate passed, the promise
 * will reject with an error with properties `code` `PREDICATE_FAILED` and
 * `details` containing any sub-errors raised by the predicate's promise.
 */
exports.first = function(predicate) {
  var result;
  var errors = [];
  var reduction = function(sequence, plugin) {
    return sequence
    .then(function() { return result || predicate(plugin); })
    .then(
      function(r) { result = result || r && plugin; },
      function(e) { errors.push(errorify(e, { plugin: plugin })); });
  };
  return exports.all().reduce(reduction, q()).then(function() {
    if (!result) {
      throw errorify('no plugin passed predicate', {
        code: 'PREDICATE_FAILED',
        details: errors
      });
    }
    return result;
  });
};

function errorify(e, properties) {
  if (!(e instanceof Error)) { e = new Error(e); }
  return _.extend(e, properties);
}

function rethrowUnlessFailedRequire(name, e) {
  var rethrow = true;
  if (e.code === 'MODULE_NOT_FOUND') {
    var match = e.message.match(/^cannot find module '(.*)'$/i);
    if (match) { rethrow = (match[1] !== name); }
  }
  if (rethrow) { throw e; }
}
