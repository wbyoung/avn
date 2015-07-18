'use strict';

var util = require('util');
var chalk = require('chalk');

/**
 * Build the success string for displaying to the user.
 *
 * @private
 * @function fmt.success
 * @param {String} version The requested version number to be activated
 * @param {String} result The exact version number that was activated
 * @param {String} via The file that triggered the activation. Only supply
 * this if the file is not `./.node-version`.
 * @return {String}
 */
exports.success = function(version, result, via) {
  return util.format(chalk.bold.magenta('avn') +
    chalk.cyan(' activated %s ') +
    chalk.gray('%s') +
    chalk.gray('(%s %s)') + '\n', version,
    via ? 'via ' + via + ' ' : '',
    result.plugin.name, result.version);
};

/**
 * Build a detailed error string for displaying to the user.
 *
 * @private
 * @function fmt.~errorDetail
 * @param {Error} error The error for which to build a string.
 * @return {String}
 */
var errorDetail = function(error) {
  return util.format('  %s: %s',
    chalk.magenta(error.plugin.name),
    error.message);
};

/**
 * Build a failure string for displaying to the user.
 *
 * @private
 * @function fmt.failure
 * @param {String} version The requested version number to be activated
 * @param {String} result The error that was generated while trying to
 * activate
 * @param {Boolean} verbose True if full error details should be included.
 * @return {String}
 */
exports.failure = function(version, error, verbose) {
  var message = util.format('%s %s',
    chalk.red('avn'),
    chalk.yellow(util.format('could not activate node %s', version)));
  if (verbose) {
    message += '\n';
    message += util.format('%s: %s\n%s',
      chalk.red(error.name.toLowerCase()), error.message,
      error.details.map(errorDetail).join('\n'));
  }
  return message;
};
