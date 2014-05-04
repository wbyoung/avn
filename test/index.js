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
      it('calls plugin match function', function(done) {
        var std = capture();
        avn.hooks.after(example('v0.10.26')).done(function() {
          std.restore();
          expect(plugin.match).to.have.been.calledWith('0.10.26');
          expect(std.err).to.be.empty;
          expect(std.out).to.eql('avn using node 0.10.26 (test v0.10.26)\n');
          expect(std.cmd).to.eql('node-version-tool activate 0.10.26\n');
          done();
        });
      });

      it('fails if plugin does returns undefined', function(done) {
        var std = capture();
        plugin = { name: 'test', match: sinon.spy(function() {}) };
        avn.hooks.after(example('v0.10.26')).done(function() {
          std.restore();
          expect(plugin.match).to.have.been.calledWith('0.10.26');
          expect(std.out).to.be.empty;
          expect(std.cmd).to.be.empty;
          expect(std.err).to.eql('avn could not activate node 0.10.26\n');
          done();
        });
      });
    });
  });
});
