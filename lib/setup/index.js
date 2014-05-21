var _ = require('lodash');
var q = require('q');
var chalk = require('chalk');
var install = require('./install');
var profile = require('./profile');
var config = require('./config');

module.exports = function() {
  return q.allSettled([
    install.all(),
    profile.update(),
    config.update()
  ])
  .then(function(results) {
    var errors = results
    .filter(function(r) { return r.state !== 'fulfilled'; })
    .map(function(r) { return r.reason.message; });

    if (errors.length) {
      console.error('%s: %s', chalk.bold.red('error'), errors.join(', '));
    }
  });
};

_.extend(module.exports, { // exposed for testing only
  _install: install.all,
  _updateProfile: profile.update,
  _updateConfigurationFile: config.update
});
