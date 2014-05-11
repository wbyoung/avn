/* jshint expr: true */
/* global before, beforeEach, after */

var avn = require('..');
var path = require('path');
var plugins = require('../lib/plugins');
var util = require('util');
var fs = require('fs');
var q = require('q');
var child_process = require('child_process');
var concat = require('concat-stream');

var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));

var runScript = function(script) {
  var deferred = q.defer();
  var cmd = child_process.spawn(script, { stdio: 'inherit' });
  cmd.on('close', function(code) {
    if (code === 0) { deferred.resolve(code); }
    else { deferred.reject(code); }
  });
  return deferred.promise;
};

describe('avn shell integration', function() {
  var shell = path.join(__dirname, 'shell');
  fs.readdirSync(shell).forEach(function(file) {
    if (file.match(/\.sh$/)) {
      it('`' + file + '`', function(done) {
        runScript(path.join(shell, file))
        .then(function() { })
        .fail(function(result) {
          throw new Error(util.format('%s exited with status: %d', file, result));
        })
        .done(done);
      });
    }
  });
});
