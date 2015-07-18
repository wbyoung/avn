'use strict';

var _ = require('lodash');
var Promise = require('bluebird');
var fs = require('mz/fs');
var path = require('path');
var util = require('util');
var chalk = require('chalk');
var isNoEntry = require('../util/codes').isNoEntry;

/**
 * Generate the string to be included in the shell init script.
 *
 * @private
 * @function setup.profile.~script
 * @return {String}
 */
var script = function() {
  var script = '$HOME/.avn/bin/avn.sh';
  return util.format('[[ -s "%s" ]] && source "%s" # load avn\n',
    script, script);
};

/**
 * Update a named profile file to include the load script,
 * {@link setup.profile.~script}.
 *
 * @private
 * @function setup.profile.~appendScript
 * @param {String} name The name of the profile file.
 * @param {Object} [options]
 * @param {Boolean} [options.force] Force the creation of the file.
 * @return {Promise}
 */
var appendScript = function(name, options) {
  var opts = options || {};
  var line = script();
  var file = path.join(process.env.HOME, name);

  return fs.readFile(file, 'utf8').catch(isNoEntry, _.noop)
  .then(function(result) {
    var exists = !!result;
    var contents = result || '';
    if (contents[contents.length - 1] !== '\n') {
      line = '\n' + line;
    }

    if (contents.match(/avn\.sh/)) {
      console.log('%s: %s %s',
        chalk.bold.magenta('avn'),
        chalk.yellow('profile already set up'),
        chalk.grey('(~/' + name + ')'));
      return 'no-change';
    }
    else if (exists || opts.force) {
      return Promise.resolve('change')
      .tap(function() { return fs.appendFile(file, line); })
      .tap(function() {
        console.log('%s: %s %s', chalk.bold.magenta('avn'),
          chalk.cyan('profile setup complete'),
          chalk.grey('(~/' + name + ')'));
      });
    }

  });
};

/**
 * Update `~/.bash_profile` and `.zshrc` shell profile files.
 *
 * Adds the necessary commands to load `avn.sh` when a new shell is launched.
 *
 * @private
 * @function setup.profile.update
 * @return {Promise}
 */
module.exports.update = function() {
  var handled = false;
  var changed = false;

  var promise = Promise.map(['.bash_profile', '.zshrc'], function(name) {
    return appendScript(name);
  })
  .each(function(result) {
    if (result) {
      handled = true;
      changed = changed || (result === 'change');
    }
  });

  promise = promise.then(function() {
    if (!handled) {
      return appendScript('.bash_profile', { force: true });
    }
  })
  .then(function(result) {
    if (result) {
      handled = true;
      changed = changed || (result === 'change');
    }
  });

  return promise.then(function() {
    if (changed) {
      console.log('%s: %s', chalk.bold.magenta('avn'),
        chalk.bold.cyan('restart your terminal to start using avn'));
    }
  });
};
