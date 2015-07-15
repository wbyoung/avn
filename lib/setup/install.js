var Promise = require('bluebird');
var fs = require('fs');
var cp = require('child_process');
var path = require('path');
var chalk = require('chalk');
var installedPlugins = require('./plugins').installed;

var install = function(src, dst) {
  var version = function(root) {
    try { return JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version; }
    catch (e) {}
  };

  return new Promise(function(resolve, reject) {
    var srcVersion = version(src);
    var dstVersion = version(dst);
    if (srcVersion === dstVersion) { resolve(); }
    else {
      var cmd = cp.spawn('/bin/cp', ['-RL', src, dst]);
      cmd.stdout.pipe(process.stdout);
      cmd.stderr.pipe(process.stderr);
      cmd.on('close', function(code) {
        if (code === 0) { resolve(dstVersion ? 'updated' : 'complete'); }
        else { reject(new Error('cp exited with status: ' + code)); }
      });
    }
  });
};

var avn = function() {
  var src = path.resolve(path.join(__dirname, '../..')) + '/';
  var dst = path.join(process.env.HOME, '.avn');
  return install(src, dst).then(function(change) {
    if (change) {
      console.log('%s: %s', chalk.bold.magenta('avn'),
        chalk.cyan('installation ' + change));
    }
  });
};

var plugins = function() {
  return installedPlugins().then(function(plugins) {
    return Promise.all(plugins.map(function(plugin) {
      var src = plugin.path + '/';
      var dst = path.join(process.env.HOME,
        path.join('.avn/plugins', plugin.moduleName));
      return install(src, dst).then(function(change) {
        if (change) {
          console.log('%s: %s', chalk.bold.magenta(plugin.moduleName),
            chalk.cyan('installation ' + change));
        }
      });
    }));
  });
};

module.exports.all = function() {
  return Promise.resolve().then(avn).then(plugins);
};
