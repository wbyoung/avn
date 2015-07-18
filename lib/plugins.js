'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var path = require('path');
var fs = require('mz/fs');
var isNoEntry = require('./util/codes').isNoEntry;
var rethrowUnlessFailedRequire;

/**
 * Get all installed plugins.
 *
 * @private
 * @function plugins.all
 * @return {Array} All plugin modules ordered by the preferences in the
 * `~/.avnrc` configuration file.
 */
exports.all = (function() {
  var cache;
  return function() {
    return cache || (cache = exports._all());
  };
})();

/**
 * Helper for getting all installed plugins.
 *
 * This uses the `plugins` property from the configuration file, `~/.avnrc` to
 * determine the order in which plugins should be returned.
 *
 * @private
 * @function plugins.~_all
 * @return {Array}
 * @see {@link plugins.all}
 * @see {@link setup.config.update}
 */
exports._all = function() {
  // TODO: is there a simpler way of determining the plugins?
  // getting the plugins from the config file & appending `nvm` and `n` does
  // not seem appropriate. it seems more appropriate to not include them.
  // TODO: should plugins be loaded globally? it probably makes sense to only
  // load them from `~/.avn/plugins`.
  // TODO: if above is done, there's probably no reason to try/catch loading
  // plugin. if require of any plugin fails, the configuration could be
  // considered invalid.

  // look at ~/.avnrc file to get the order of plugins, but fall back on a
  // default order if there's no config.
  var file = path.join(process.env.HOME, '.avnrc');

  return fs.readFile(file, 'utf8').catch(isNoEntry, _.noop)
  .then(function(contents) {
    var config = contents && JSON.parse(contents) || {};
    return _.union(config.plugins, ['nvm', 'n']);
  })
  .reduce(function(array, name) {
    var plugin;
    var installed = path.join(process.env.HOME, '.avn/plugins', 'avn-' + name);
    try { plugin = require(installed); }
    catch (e) { rethrowUnlessFailedRequire(installed, e); }
    var global = 'avn-' + name;
    try { plugin = plugin || require(global); }
    catch (e) { rethrowUnlessFailedRequire(global, e); }
    if (plugin) { array.push(plugin); }
    return array;
  }, []);
};

/**
 * Get the first plugin matching a predicate.
 *
 * @private
 * @function plugins.first
 * @param {Function} predicate A function that takes one argument, the plugin
 * and returns a truthful value (or a promise that resolves to a truthful
 * value).
 * @return {Promise} A promise that resolves to the plugin that resulted in a
 * successful evaluation of the predicate. if no predicate passed, the promise
 * will reject with an error with properties `code` `PREDICATE_FAILED` and
 * `details` containing any sub-errors raised by the predicate's promise.
 */
exports.first = function(predicate) {
  var errors = [];
  return Promise.reduce(exports.all(), function(result, plugin) {
    return result || Promise.resolve(predicate(plugin))
    .then(function(r) { return r && plugin; })
    .catch(function(e) {
      errors.push(_.extend(e, { plugin: plugin }));
    });
  }, null)
  .then(function(result) {
    if (!result) {
      throw _.extend(new Error('no plugin passed predicate'), {
        code: 'PREDICATE_FAILED',
        details: errors,
      });
    }
    return result;
  });
};

/**
 * Rethrow when the error is not for a failed `require`.
 *
 * @private
 * @function plugins.~rethrowUnlessFailedRequire
 * @param {Error} error The error to check.
 */
rethrowUnlessFailedRequire = function(name, e) {
  var rethrow = true;
  if (e.code === 'MODULE_NOT_FOUND') {
    var match = e.message.match(/^cannot find module '(.*)'$/i);
    if (match) { rethrow = (match[1] !== name); }
  }
  if (rethrow) { throw e; }
};
