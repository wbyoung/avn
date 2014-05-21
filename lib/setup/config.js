var _ = require('lodash');
var q = require('q');
var fs = require('fs');
var env = require('./env');
var path = require('path');
var write = require('./util').write;
var chalk = require('chalk');

module.exports.update = function() {
  var file = path.join(process.env.HOME, '.avnrc');
  var contents = fs.existsSync(file) && fs.readFileSync(file);
  var config = contents && JSON.parse(contents) || {};
  var change = 'unchanged';

  return q()
  .then(function() { return env.npm.avnPlugins(); })
  .then(function(plugins) {
    plugins = _.map(plugins, 'name');
    plugins = _.difference(plugins, ['nvm', 'n']);
    plugins = _.union(config.plugins, plugins);
    if (!_.isEqual(config.plugins, plugins)) {
      config.plugins = plugins;
      change = (contents ? 'updated' : 'complete');
      return write(file, JSON.stringify(config, null, 2));
    }
  })
  .then(function() {
    console.log('%s: %s %s', chalk.bold.magenta('avn'),
      chalk.cyan('configuration ' + change),
      chalk.grey('(~/.avnrc)'));
  });
};
