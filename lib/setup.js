var _ = require('lodash');
var Promise = require('bluebird');
var chalk = require('chalk');

module.exports = function() {
  return Promise.settle([
    require('./setup/install').all(),
    require('./setup/profile').update(),
    require('./setup/config').update()
  ])
  .then(function(results) {
    var errors = _(results)
      .filter(_.method('isRejected'))
      .map(_.method('reason'))
      .map('message').value();

    if (errors.length) {
      console.error('%s: %s', chalk.bold.red('error'), errors.join(', '));
    }
  });
};
