'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var fs = require('mz/fs');
var cp = require('child_process');
var path = require('path');
var chalk = require('chalk');
var installedPlugins = require('./plugins').installed;
var isNoEntry = require('../util/codes').isNoEntry;

/**
 * Get a module version by reading it's package.json.
 *
 * @private
 * @function setup.install.~moduleVersion
 * @param {String} module The path to the module.
 * @return {Promise}
 */
var moduleVersion = function(module) {
  return fs.readFile(path.join(module, 'package.json'), 'utf8')
  .catch(isNoEntry, _.noop).then(function(contents) {
    try { return JSON.parse(contents).version; }
    catch (e) {}
  });
};

/**
 * Install a module by copying it from the source to the destination.
 *
 * @private
 * @function setup.install.~install
 * @param {String} src The source location.
 * @param {String} dst The destination location.
 * @return {Promise}
 */
var install = function(src, dst) {
  var srcVersion, dstVersion;
  return Promise.resolve()
  .then(function() { return moduleVersion(src); })
  .then(function(v) { srcVersion = v; })
  .then(function() { return moduleVersion(dst); })
  .then(function(v) { dstVersion = v; })
  .then(function() {
    return new Promise(function(resolve, reject) {
      if (srcVersion === dstVersion) { resolve(); }
      else {
        var cmd = cp.spawn('/bin/cp', ['-RL', src, dst]);
        cmd.stdout.pipe(process.stdout);
        cmd.stderr.pipe(process.stderr);
        cmd.on('close', function(code) {
          if (code === 0) { resolve(dstVersion ? 'updated' : 'complete'); }
          else { reject(new Error('cp exited with status: ' + code)); }
        });
      }
    });

  });
};

/**
 * Install the avn module to `~/.avn` & report on installation.
 *
 * @private
 * @function setup.install.~avn
 * @return {Promise}
 */
var avn = function() {
  var src = path.resolve(path.join(__dirname, '../..')) + '/';
  var dst = path.join(process.env.HOME, '.avn');
  return install(src, dst).then(function(change) {
    if (change) {
      console.log('%s: %s', chalk.bold.magenta('avn'),
        chalk.cyan('installation ' + change));
    }
  });
};

/**
 * Install all avn plugins to `~/.avn/plugins/{name}` & report on installation.
 *
 * @private
 * @function setup.install.~plugins
 * @return {Promise}
 */
var plugins = function() {
  return installedPlugins().then(function(plugins) {
    return Promise.all(plugins.map(function(plugin) {
      var src = plugin.path + '/';
      var dst = path.join(process.env.HOME,
        path.join('.avn/plugins', plugin.moduleName));
      return install(src, dst).then(function(change) {
        if (change) {
          console.log('%s: %s', chalk.bold.magenta(plugin.moduleName),
            chalk.cyan('installation ' + change));
        }
      });
    }));
  });
};

/**
 * Run all installation actions.
 *
 * @private
 * @function setup.install.all
 * @return {Promise}
 * @see {@link plugins.~all}
 */
module.exports.all = function() {
  return Promise.resolve().then(avn).then(plugins);
};
