var _ = require('lodash');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var util = require('util');
var chalk = require('chalk');
var path = require('path');
var plugins = require('./plugins');


/**
 * Output formatting
 */

var strings = {
  success: function(version, result, via) {
    return util.format(chalk.bold.magenta('avn') +
      chalk.cyan(' activated %s ') +
      chalk.gray('%s') +
      chalk.gray('(%s %s)') + '\n', version,
      via ? 'via ' + via + ' ' : '',
      result.plugin.name, result.version);
  },
  failure: function(version, error, verbose) {
    var message = util.format('%s %s',
      chalk.red('avn'),
      chalk.yellow(util.format('could not activate node %s', version)));
    if (verbose) {
      message += '\n';
      message += util.format('%s: %s\n%s',
        chalk.red(error.name.toLowerCase()), error.message,
        error.details.map(strings.errors.detail).join('\n'));
    }
    return message;
  },
  errors: {
    detail: function(error) {
      return util.format('  %s: %s', chalk.magenta(error.plugin.name), error.message);
    }
  }
};


/**
 * After changing directories
 */

var match = function(version) {
  var result;
  var ensure = function(key) {
    return function(r) {
      if (r && !r[key]) { throw 'result missing ' + key; }
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

exports.chpwd = function(/*dir, [versionFile], [options]*/) {
  var args = Array.prototype.slice.call(arguments, 0);
  var dir = args.shift();
  var file = _.isString(args[0]) && args.shift() || '.node-version';
  var opts = args.shift() || {};
  var via;

  if (path.resolve(dir) !== process.cwd() || file !== '.node-version') {
    via = path.join(path.relative(process.cwd(), dir), file);
  }

  return Promise.resolve()
  .then(function() { return fs.readFileAsync(path.join(dir, file), 'utf8'); })
  .then(function(v) { return (version = v.trim()); })
  .then(function(version) { return match(version); })
  .then(function(result) {
    process.stdout.write(strings.success(version, result, via));
    process.stdcmd.write(result.command + '\n');
  })
  .catch(rethrowUnlessNoEntry)
  .catch(function(e) {
    if (e.code !== 'PREDICATE_FAILED') { throw e; }
    else { console.warn(strings.failure(version, e, opts.verbose)); }
  });
};


/**
 * Utility
 */

function rethrowUnlessNoEntry(e) {
  if (e.code === 'ENOENT') { }
  else { throw e; }
}
