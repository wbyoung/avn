'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var fs = require('mz/fs');
var path = require('path');
var plugins = require('./plugins');
var fmt = require('./fmt');
var isNoEntry = require('./util/codes').isNoEntry;

/**
 * Find the first plugin that can activate the requested version.
 *
 * @private
 * @function hooks.~match
 * @param {String} version The semver version to activate.
 * @return {Promise} A promise that resolves with both `version` and `command`
 * properties.
 */
var match = function(version) {
  var result;
  /** local */
  var ensure = function(key) {
    return function(r) {
      if (r && !r[key]) { throw new Error('result missing ' + key); }
      return r;
    };
  };
  return plugins.first(function(plugin) {
    return Promise.resolve()
    .then(function() { return plugin.match(version); })
    .then(ensure('command'))
    .then(ensure('version'))
    .then(function(r) { return (result = r); });
  })
  .then(function(plugin) {
    return result && _.extend({ plugin: plugin }, result);
  });
};

/**
 * Hook for `chpwd` which is triggered after changing the current working
 * directory.
 *
 * This function writes information to `stdcmd` (file descriptor #3) that
 * should be executed in the context of the current shell in order to activate
 * the proper version of node. It also writes to `stdout` & `stderr` to inform
 * the user of what activation has occurred.
 *
 * This is invoked by `_avn` & triggered by the `chpwd` shell hook that is
 * installed in `avn.sh`.
 *
 * @private
 * @function hooks.chpwd
 * @param {String} dir The directory into which the user has moved.
 * @param {String} [versionFile] The name of the version file to read within
 * the directory.
 * @param {Object} [options]
 * @param {Boolean} [options.verbose] Enable verbose output.
 * @return {Promise}
 */
exports.chpwd = function(/*dir, [versionFile], [options]*/) {
  var args = Array.prototype.slice.call(arguments, 0);
  var dir = args.shift();
  var file = _.isString(args[0]) && args.shift() || '.node-version';
  var opts = args.shift() || {};
  var via;

  if (path.resolve(dir) !== process.cwd() || file !== '.node-version') {
    via = path.join(path.relative(process.cwd(), dir), file);
  }

  return Promise.bind({})
  .then(function() { return fs.readFile(path.join(dir, file), 'utf8'); })
  .then(function(version) { this.version = version.trim(); })
  .then(function() { return match(this.version); })
  .then(function(result) {
    process.stdout.write(fmt.success(this.version, result, via));
    process.stdcmd.write(result.command + '\n');
  })
  .catch(isNoEntry, _.noop)
  .catch(function(e) {
    if (e.code !== 'PREDICATE_FAILED') { throw e; }
    else { console.warn(fmt.failure(this.version, e, opts.verbose)); }
  });
};
