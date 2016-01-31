'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var chalk = require('chalk');

/**
 * Run all setup procedures in parallel.
 *
 * @private
 * @function setup
 * @return {Promise}
 */
module.exports = function() {
  return Promise.all([
    require('./setup/install').all().reflect(),
    require('./setup/profile').update().reflect(),
    require('./setup/config').update().reflect(),
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
