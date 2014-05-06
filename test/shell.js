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
  var stdout, stderr;
  var cmd = child_process.spawn(script);

  cmd.stdout.pipe(concat({ encoding: 'string' }, function(data) {
    stdout = data;
  }));

  cmd.stderr.pipe(concat({ encoding: 'string' }, function(data) {
    stderr = data;
  }));

  cmd.on('close', function (code) {
    var result = { stdout: stdout, stderr: stderr, status: code };
    if (code === 0) { deferred.resolve(result); }
    else { deferred.reject(result); }
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
          var stdout = result.stdout.trim();
          var stderr = result.stderr.trim();
          throw new Error(util.format('%s exited with status: %d\n      ' +
            'stdout: %s\n      ' +
            'stderr: %s', file, result.status, stdout, stderr));
        })
        .done(done);
      });
    }
  });
});
