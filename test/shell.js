'use strict';

require('./helpers');

var Promise = require('bluebird');
var path = require('path');
var util = require('util');
var fs = require('fs');
var spawn = require('child_process').spawn;

var runScript = function(shell, script) {
  return new Promise(function(resolve, reject) {
    var cmd = spawn(shell, [script], { stdio: 'inherit' });
    cmd.on('close', function(code) {
      if (code === 0) { resolve(code); }
      else { reject(code); }
    });
  });
};

describe('avn shell integration', function() {
  ['bash', 'zsh'].forEach(function(type) {
    describe(type, function() {
      var shell = path.join(__dirname, 'shell');
      fs.readdirSync(shell).forEach(function(file) {
        if (file.match(/\.sh$/)) {
          it('`' + file + '`', function() {
            return runScript(type, path.join(shell, file))
            .then(function() { })
            .catch(function(result) {
              throw new Error(util.format('%s exited with status: %d', file, result));
            });
          });
        }
      });
    });
  });
});
