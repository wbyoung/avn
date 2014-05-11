var _ = require('lodash');
var q = require('q');
var fs = require('fs');
var path = require('path');
var util = require('util');
var chalk = require('chalk');
var child_process = require('child_process');

var npmModules = function() {
  var npm = require('npm');
  var load = q.nbind(npm.load, npm);

  return q()
  .then(function() { return load({ global: true }); })
  .then(function(npm) { return q.nfcall(npm.commands.list, [], true); })
  .spread(function(full) { return full.dependencies; });
};

var avnPlugins = function() {
  return q()
  .then(function() { return npmModules(); })
  .then(function(modules) {
    return _(modules)
    .keys()
    .filter(function(module) {
      return module.match(/^avn-/);
    })
    .map(function(module) {
      return module.slice('avn-'.length);
    })
    .value();
  });
};

var sourceScriptLine = function() {
  var script = '$HOME/.avn/bin/avn.sh';
  return util.format('[[ -s "%s" ]] && source "%s" # load avn\n', script, script);
};

var install = function() {
  var version = function(root) {
    try { return JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version; }
    catch (e) {}
  };

  var deferred = q.defer();
  var src = path.resolve(path.join(__dirname, '..'));
  var srcVersion = version(src);
  var dst = path.join(process.env.HOME, '.avn');
  var dstVersion = version(dst);

  if (srcVersion !== dstVersion) {
    var cmd = child_process.spawn('/bin/cp', ['-RL', src, dst]);
    cmd.stdout.pipe(process.stdout);
    cmd.stderr.pipe(process.stderr);
    cmd.on('close', function(code) {
      if (code === 0) {
        var change = dstVersion ? 'updated' : 'complete';
        console.log('%s: %s', chalk.bold.magenta('avn'),
          chalk.cyan('installation ' + change));
      }

      if (code === 0) { deferred.resolve(); }
      else { deferred.reject('cp exited with status: ' + code); }
    });
  }

  return deferred.promise;
};

var updateProfile = function() {
  var line = sourceScriptLine();
  var profile = path.join(process.env.HOME, '.bash_profile');
  var contents = fs.readFileSync(profile, 'utf8');
  if (contents[contents.length - 1] !== '\n') {
    line = '\n' + line;
  }

  if (contents.match(/avn\.sh/)) {
    console.log('%s: %s %s',
      chalk.bold.magenta('avn'),
      chalk.yellow('profile already set up'),
      chalk.grey('(~/.bash_profile)'));
  }
  else {
    var stream = fs.createWriteStream(profile, { flags : 'a' });
    stream.write(line);
    stream.close();
    console.log('%s: %s %s', chalk.bold.magenta('avn'),
      chalk.cyan('profile setup complete'),
      chalk.grey('(~/.bash_profile)'));
    console.log('%s: %s', chalk.bold.magenta('avn'),
      chalk.bold.cyan('restart your terminal to start using avn'));
  }
};

var updateConfigurationFile = function() {
  var file = path.join(process.env.HOME, '.avnrc');
  var contents = fs.existsSync(file) && fs.readFileSync(file);
  var config = contents && JSON.parse(contents) || {};
  var change = 'unchanged';

  q()
  .then(function() { return avnPlugins(); })
  .then(function(plugins) {
    plugins = _.difference(config.plugins, ['nvm', 'n']);
    if (!_.isEqual(config.plugins, plugins)) {
      config.plugins = plugins;
      change = (contents ? 'updated' : 'complete');
      var stream = fs.createWriteStream(file);
      stream.write(JSON.stringify(config, null, 2));
      stream.close();
    }
    console.log('%s: %s %s', chalk.bold.magenta('avn'),
      chalk.cyan('configuration ' + change),
      chalk.grey('(~/.avnrc)'));
  })
  .done();
};

module.exports = function() {
  q.allSettled([
    install(),
    updateProfile(),
    updateConfigurationFile()
  ])
  .then(function (results) {
    var errors = results
    .filter(function(r) { return r.state !== 'fulfilled'; })
    .map(function(r) { return r.reason.message; }).join(', ');

    if (errors) {
      console.error('%s: %s', chalk.bold.red('error'), errors.join(', '));
    }
  }).done();
};
