/* jshint expr: true */
/* global before, beforeEach, after */

var avn = require('..');
var path = require('path');
var chalk = require('chalk');
var plugins = require('../lib/plugins');
var concat = require('concat-stream');

var sinon = require('sinon');
var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));

var cwd;
var capture = require('./helpers').capture;
var setupExample = function(name) {
  cwd = path.join(__dirname, 'fixtures', name);
  return cwd;
};

describe('avn', function() {

  describe('hooks', function() {
    var all = plugins.all;
    var chalkEnabled = chalk.enabled;
    var plugin;

    before(function() {
      chalk.enabled = false;
      plugins.all = function() {
        return [plugin];
      };
      sinon.stub(process, 'cwd', function() {
        return cwd;
      });
    });

    after(function() {
      chalk.enabled = chalkEnabled;
      plugins.all = all;
      process.cwd.restore();
    });

    beforeEach(function() {
      plugin = {
        name: 'test',
        match: sinon.spy(function(v) {
          return { version: 'v' + v, command: 'node-version-tool activate ' + v };
        })
      };
    });

    describe('after', function() {
      it('does nothing when no version file exists', function(done) {
        var std = capture();
        setupExample('none');
        avn.hooks.chpwd(cwd).fin(std.restore).done(function() {
          expect(plugin.match).to.not.have.been.called;
          expect(std.err).to.be.empty;
          expect(std.out).to.be.empty;
          expect(std.cmd).to.be.empty;
          done();
        });
      });

      it('calls plugin match function', function(done) {
        var std = capture();
        setupExample('v0.10.26');
        avn.hooks.chpwd(cwd).fin(std.restore).done(function() {
          expect(plugin.match).to.have.been.calledWith('0.10.26');
          expect(std.err).to.be.empty;
          expect(std.out).to.eql('avn activated 0.10.26 (test v0.10.26)\n');
          expect(std.cmd).to.eql('node-version-tool activate 0.10.26\n');
          done();
        });
      });

      it('accepts version file', function(done) {
        var std = capture();
        setupExample('iojs-v1.1');
        avn.hooks.chpwd(cwd, '.iojs-version').fin(std.restore).done(function() {
          expect(plugin.match).to.have.been.calledWith('iojs-1.1');
          expect(std.err).to.be.empty;
          expect(std.out).to.eql('avn activated iojs-1.1 via .iojs-version (test viojs-1.1)\n');
          expect(std.cmd).to.eql('node-version-tool activate iojs-1.1\n');
          done();
        });
      });

      it('fails if plugin returns undefined', function(done) {
        var std = capture();
        plugin = { name: 'test', match: function() {} };
        setupExample('v0.10.26');
        avn.hooks.chpwd(cwd).fin(std.restore).done(function() {
          expect(std.out).to.be.empty;
          expect(std.cmd).to.be.empty;
          expect(std.err).to.eql('avn could not activate node 0.10.26\n');
          done();
        });
      });

      it('fails when plugin throws', function(done) {
        var std = capture();
        plugin = {
          name: 'test',
          match: function() { throw new Error('test'); }
        };
        setupExample('v0.10.26');
        avn.hooks.chpwd(cwd).fin(std.restore).done(function() {
          expect(std.out).to.be.empty;
          expect(std.cmd).to.be.empty;
          expect(std.err).to.eql('avn could not activate node 0.10.26\n');
          done();
        });
      });

      it('handles plugin throwing errors', function(done) {
        var std = capture();
        plugin = {
          name: 'test',
          match: function() { throw new Error('test'); }
        };
        setupExample('v0.10.26');
        avn.hooks.chpwd(cwd, { verbose: true }).fin(std.restore).done(function() {
          expect(std.out).to.be.empty;
          expect(std.cmd).to.be.empty;
          expect(std.err).to.eql('avn could not activate node 0.10.26\n' +
            'error: no plugin passed predicate\n  test: test\n');
          done();
        });
      });

      it('handles plugin throwing strings', function(done) {
        var std = capture();
        plugin = {
          name: 'test',
          match: function() { throw 'test'; }
        };
        setupExample('v0.10.26');
        avn.hooks.chpwd(cwd, { verbose: true }).fin(std.restore).done(function() {
          expect(std.out).to.be.empty;
          expect(std.cmd).to.be.empty;
          expect(std.err).to.eql('avn could not activate node 0.10.26\n' +
            'error: no plugin passed predicate\n  test: test\n');
          done();
        });
      });

      it('expects plugins to return object containing command', function(done) {
        var std = capture();
        plugin = {
          name: 'test',
          match: function() { return { version: 'n' }; }
        };
        setupExample('v0.10.26');
        avn.hooks.chpwd(cwd, { verbose: true }).fin(std.restore).done(function() {
          expect(std.out).to.be.empty;
          expect(std.cmd).to.be.empty;
          expect(std.err).to.eql('avn could not activate node 0.10.26\n' +
            'error: no plugin passed predicate\n  test: result missing command\n');
          done();
        });
      });

      it('expects plugins to return object containing version', function(done) {
        var std = capture();
        plugin = {
          name: 'test',
          match: function() { return { command: 'activate n' }; }
        };
        setupExample('v0.10.26');
        avn.hooks.chpwd(cwd, { verbose: true }).fin(std.restore).done(function() {
          expect(std.out).to.be.empty;
          expect(std.cmd).to.be.empty;
          expect(std.err).to.eql('avn could not activate node 0.10.26\n' +
            'error: no plugin passed predicate\n  test: result missing version\n');
          done();
        });
      });

      it('requires stdcmd stream to work', function(done) {
        var std = capture(['out', 'err']);
        setupExample('v0.10.26');
        avn.hooks.chpwd(cwd)
        .fail(function(e) {
          expect(e.message).to.match(/^cannot (call|read) (method|property) \'write\' of undefined$/i);
        })
        .fin(std.restore)
        .done(function() { done(); });
      });
    });
  });
});
