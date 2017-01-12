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
 * Chooses the correct shell init script to insert avn initialization string to,
 * based on the following criteria:
 * 1. Append to the one that's present, if the other doesn't exist,
 * 2. If both exist, append to the one that is sourced by the other, or
 * 3. If both exist, but neither sources the other,
 *    append to .bashrc if platform is 'linux',
 *    or append to .bash_profile if platform is 'darwin' (i.e. macOS)
 *
 * @private
 * @function setup.profile.~shellInitScriptChooser
 * @return {Promise}
 */
var shellInitScriptChooser = function() {
  var bashrcFile = path.join(process.env.HOME, '.bashrc');
  var bashProfileFile = path.join(process.env.HOME, '.bash_profile');
  var bashrcExists;
  var bashProfileExists;

  // Check if .bashrc exists
  var bashrcPromise = new Promise(function(resolve) {
    fs.access(bashrcFile, function(err) {
      bashrcExists = !err;
      resolve();
    });
  });

  // Check if .bash_profile exists
  var bashProfilePromise = new Promise(function(resolve) {
    fs.access(bashProfileFile, function(err) {
      bashProfileExists = !err;
      resolve();
    });
  });

  var promise = Promise.all([bashrcPromise, bashProfilePromise])
  .then(function() {
    if ((bashrcExists || bashProfileExists) &&
       !(bashrcExists && bashProfileExists)) { // ^ == bitwise XOR
      return (bashrcExists && bashrcFile) ||
             (bashProfileExists && bashProfileFile);
    }

    if (bashrcExists && bashProfileExists) {
      var innerPromise = new Promise(function(resolve) {
        fs.readFile(bashProfileFile, 'utf8', function(err, data) {
          // RegExp to detect "~/.bashrc",
          // "$HOME/.bashrc", or "/home/user/.bashrc"
          var bashrcRe = new RegExp(' ?source +(\\\\\\n)? *(~\/.bashrc|' +
            '\"?\\$HOME\/.bashrc\"?|[\'\"]?\/home\/\\w+\/.bashrc[\'\"]?)');

          if (bashrcRe.test(data)) {
            resolve(bashrcFile);
          }
          else {
            resolve();
          }
        });
      })
      .then(function(appendFile) {
        if (appendFile) {
          return appendFile;
        }

        var innerInnerPromise = new Promise(function(resolve) {
          fs.readFile(bashrcFile, 'utf8', function(err, data) {
            // RegExp to detect "~/.bash_profile",
            // "$HOME/.bash_profile", or "/home/user/.bash_profile"
            var bashProfileRe = new RegExp(' ?source +(\\\\\\n)? *' +
              '(~\/.bash_profile|\"?\\$HOME\/.bash_profile\"?|' +
              '[\'\"]?\/home\/\\w+\/.bash_profile[\'\"]?)');

            if (bashProfileRe.test(data)) {
              resolve(bashProfileFile);
            }
            else {
              resolve();
            }
          });
        });

        return innerInnerPromise;
      })
      .then(function(appendFile) {
        if (appendFile) {
          return appendFile;
        }

        // Neither .bashrc nor .bash_profile sources the other
        var platformsToInitScript = {
          linux:  bashrcFile,
          darwin: bashProfileFile,
        };

        return platformsToInitScript[process.platform];
      });

      return innerPromise;
    }
  });

  return promise;
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
  var appendFile;

  var promise = shellInitScriptChooser()
  .then(function(initScript) {
    appendFile = initScript;
    return appendScript(appendFile);
  })
  .then(function(result) {
    if (result) {
      handled = true;
      changed = changed || (result === 'change');
    }
  })

  .then(function() {
    if (!handled) {
      return appendScript(appendFile, { force: true });
    }
  })
  .then(function(result) {
    if (result) {
      handled = true;
      changed = changed || (result === 'change');
    }
  })

  .then(function() {
    if (changed) {
      console.log('%s: %s', chalk.bold.magenta('avn'),
        chalk.bold.cyan('restart your terminal to start using avn'));
    }
  });

  return promise;
};
