'use strict';

var Promise = require('bluebird');
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');
var util = require('util');
var chalk = require('chalk');

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
 * @return {{type:String, promise: Promise}}
 */
var appendScript = function(name, options) {
  var opts = options || {};
  var result;
  var line = script();
  var file = path.join(process.env.HOME, name);
  var exists = fs.existsSync(file);
  var contents = exists ? fs.readFileSync(file, 'utf8') : '';
  if (contents[contents.length - 1] !== '\n') {
    line = '\n' + line;
  }

  if (contents.match(/avn\.sh/)) {
    result = {};
    result.type = 'no-change';
    result.promise = Promise.resolve();
    console.log('%s: %s %s',
      chalk.bold.magenta('avn'),
      chalk.yellow('profile already set up'),
      chalk.grey('(~/' + name + ')'));
  }
  else if (exists || opts.force) {
    result = {};
    result.type = 'change';
    result.promise = fs.appendFileAsync(file, line)
    .then(function() {
      console.log('%s: %s %s', chalk.bold.magenta('avn'),
        chalk.cyan('profile setup complete'),
        chalk.grey('(~/' + name + ')'));
    });
  }

  return result;
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
  var promise = Promise.resolve();
  var handled = false;
  var changed = false;

  ['.bash_profile', '.zshrc'].forEach(function(name) {
    var append = appendScript(name);
    if (append) {
      promise = promise.then(function() { return append.promise; });
      handled = true;
      changed = changed || (append.type === 'change');
    }
  });

  if (!handled) {
    var append = appendScript('.bash_profile', { force: true });
    promise = promise.then(function() { return append.promise; });
    handled = true;
    changed = changed || (append.type === 'change');
  }

  if (changed) {
    promise = promise.then(function() {
      console.log('%s: %s', chalk.bold.magenta('avn'),
        chalk.bold.cyan('restart your terminal to start using avn'));
    });
  }

  return promise;
};
