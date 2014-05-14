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

var capture = require('./helpers').capture;
var example = function(name) {
  return path.join(__dirname, 'examples', name);
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
    });

    after(function() {
      chalk.enabled = chalkEnabled;
      plugins.all = all;
    });

    beforeEach(function() {
      plugin = {
        name: 'test',
        match: sinon.spy(function(v) {
          return { version: 'v' + v, command: 'node-version-tool activate ' + v };
        })
      };
    });

    describe('before', function() {
      it('exists', function(done) {
        avn.hooks.before(example('v0.10.26')).done(done);
      });
    });

    describe('after', function() {
      it('does nothing when no version file exists', function(done) {
        var std = capture();
        avn.hooks.after(example('none')).fin(std.restore).done(function() {
          expect(plugin.match).to.not.have.been.called;
          expect(std.err).to.be.empty;
          expect(std.out).to.be.empty;
          expect(std.cmd).to.be.empty;
          done();
        });
      });

      it('calls plugin match function', function(done) {
        var std = capture();
        avn.hooks.after(example('v0.10.26')).fin(std.restore).done(function() {
          expect(plugin.match).to.have.been.calledWith('0.10.26');
          expect(std.err).to.be.empty;
          expect(std.out).to.eql('avn using node 0.10.26 (test v0.10.26)\n');
          expect(std.cmd).to.eql('node-version-tool activate 0.10.26\n');
          done();
        });
      });

      it('fails if plugin returns undefined', function(done) {
        var std = capture();
        plugin = { name: 'test', match: function() {} };
        avn.hooks.after(example('v0.10.26')).fin(std.restore).done(function() {
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
        avn.hooks.after(example('v0.10.26')).fin(std.restore).done(function() {
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
        avn.hooks.after(example('v0.10.26'), { verbose: true }).fin(std.restore).done(function() {
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
        avn.hooks.after(example('v0.10.26'), { verbose: true }).fin(std.restore).done(function() {
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
        avn.hooks.after(example('v0.10.26'), { verbose: true }).fin(std.restore).done(function() {
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
        avn.hooks.after(example('v0.10.26'), { verbose: true }).fin(std.restore).done(function() {
          expect(std.out).to.be.empty;
          expect(std.cmd).to.be.empty;
          expect(std.err).to.eql('avn could not activate node 0.10.26\n' +
            'error: no plugin passed predicate\n  test: result missing version\n');
          done();
        });
      });

      it('requires stdcmd stream to work', function(done) {
        var std = capture(['out', 'err']);
        avn.hooks.after(example('v0.10.26'))
        .fail(function(e) {
          expect(e.message).to.match(/^cannot (call|read) (method|property) \'write\' of undefined$/i);
        })
        .fin(std.restore)
        .done(function() { done(); });
      });
    });
  });
});
