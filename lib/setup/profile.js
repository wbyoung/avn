var q = require('q');
var fs = require('fs');
var qfs = require('../util/qfs');
var path = require('path');
var util = require('util');
var chalk = require('chalk');

var script = function() {
  var script = '$HOME/.avn/bin/avn.sh';
  return util.format('[[ -s "%s" ]] && source "%s" # load avn\n', script, script);
};

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
    result.promise = q();
    console.log('%s: %s %s',
      chalk.bold.magenta('avn'),
      chalk.yellow('profile already set up'),
      chalk.grey('(~/' + name + ')'));
  }
  else if (exists || opts.force) {
    result = {};
    result.type = 'change';
    result.promise = qfs.write(file, line, { flags: 'a' })
    .then(function() {
      console.log('%s: %s %s', chalk.bold.magenta('avn'),
        chalk.cyan('profile setup complete'),
        chalk.grey('(~/' + name + ')'));
    });
  }

  return result;
};

module.exports.update = function() {
  var promise = q();
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
