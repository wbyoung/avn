'use strict';

var Promise = require('bluebird');
var path = require('path');
var util = require('util');
var fs = require('fs');
var spawn = require('child_process').spawn;

var chai = require('chai');
chai.use(require('sinon-chai'));

var runScript = function(script) {
  return new Promise(function(resolve, reject) {
    var cmd = spawn(script, [], { stdio: 'inherit' });
    cmd.on('close', function(code) {
      if (code === 0) { resolve(code); }
      else { reject(code); }
    });
  });
};

describe('avn shell integration', function() {
  var shell = path.join(__dirname, 'shell');
  fs.readdirSync(shell).forEach(function(file) {
    if (file.match(/\.sh$/)) {
      it('`' + file + '`', function() {
        return runScript(path.join(shell, file))
        .then(function() { })
        .catch(function(result) {
          throw new Error(util.format('%s exited with status: %d', file, result));
        });
      });
    }
  });
});
