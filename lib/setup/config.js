var _ = require('lodash');
var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');
var chalk = require('chalk');
var installedPlugins = require('./plugins').installed;

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
