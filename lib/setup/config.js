'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');
var chalk = require('chalk');
var installedPlugins = require('./plugins').installed;

/**
 * Update `~/.avnrc` configuration file.
 *
 * This locates all installed plugins and uses them to create a configuration
 * for avn. The configuration file supports the following properties:
 *
 *   - plugins: The order in which plugins should be used
 *
 * The default configuration is to ignore all well known plugins (`avn-nvm` and
 * `avn-n`) and add any custom plugins to the configuration file. Use of the
 * plugins list should not assume that the list is complete or where the
 * plugins are installed. They could be installed to `~/.avn/plugins` or as a
 * global module. This would allow users to more easily create & test a plugin,
 * but will probably be removed in the future.
 *
 * @private
 * @function setup.config.update
 * @return {Promise}
 * @see {@link plugins.~all}
 */
module.exports.update = function() {
  var file = path.join(process.env.HOME, '.avnrc');
  var contents = fs.existsSync(file) && fs.readFileSync(file);
  var config = contents && JSON.parse(contents) || {};
  var change = 'unchanged';

  return Promise.resolve()
  .then(function() { return installedPlugins(); })
  .then(function(plugins) {
    plugins = _.map(plugins, 'name');
    plugins = _.difference(plugins, ['nvm', 'n']);
    plugins = _.union(config.plugins, plugins);
    if (!_.isEqual(config.plugins, plugins)) {
      config.plugins = plugins;
      change = (contents ? 'updated' : 'complete');
      return fs.writeFileAsync(file, JSON.stringify(config, null, 2));
    }
  })
  .then(function() {
    console.log('%s: %s %s', chalk.bold.magenta('avn'),
      chalk.cyan('configuration ' + change),
      chalk.grey('(~/.avnrc)'));
  });
};
