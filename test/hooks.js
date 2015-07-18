'use strict';

require('./helpers');

var Promise = require('bluebird');
var avn = require('..');
var path = require('path');
var chalk = require('chalk');
var plugins = require('../lib/plugins');

var cwd;
var capture = require('./helpers').capture;
var setupExample = function(name) {
  cwd = path.join(__dirname, 'fixtures', name);
  return cwd;
};

describe('avn', function() {

  describe('hooks', function() {
    var chalkEnabled = chalk.enabled;
    var plugin;

    before(function() {
      chalk.enabled = false;
      sinon.stub(plugins, 'all', function() {
        return Promise.resolve([plugin]);
      });
      sinon.stub(process, 'cwd', function() {
        return cwd;
      });
    });

    after(function() {
      chalk.enabled = chalkEnabled;
      plugins.all.restore();
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
      it('does nothing when no version file exists', function() {
        var std = capture();
        setupExample('none');
        return avn.hooks.chpwd(cwd).finally(std.restore).then(function() {
          expect(plugin.match).to.not.have.been.called;
          expect(std.err).to.be.empty;
          expect(std.out).to.be.empty;
          expect(std.cmd).to.be.empty;
        });
      });

      it('calls plugin match function', function() {
        var std = capture();
        setupExample('v0.10.26');
        return avn.hooks.chpwd(cwd).finally(std.restore).then(function() {
          expect(plugin.match).to.have.been.calledWith('0.10.26');
          expect(std.err).to.be.empty;
          expect(std.out).to.eql('avn activated 0.10.26 (test v0.10.26)\n');
          expect(std.cmd).to.eql('node-version-tool activate 0.10.26\n');
        });
      });

      it('accepts version file', function() {
        var std = capture();
        setupExample('iojs-v1.1');
        return avn.hooks.chpwd(cwd, '.iojs-version').finally(std.restore).then(function() {
          expect(plugin.match).to.have.been.calledWith('iojs-1.1');
          expect(std.err).to.be.empty;
          expect(std.out).to.eql('avn activated iojs-1.1 via .iojs-version (test viojs-1.1)\n');
          expect(std.cmd).to.eql('node-version-tool activate iojs-1.1\n');
        });
      });

      it('fails if plugin returns undefined', function() {
        var std = capture();
        plugin = { name: 'test', match: function() {} };
        setupExample('v0.10.26');
        return avn.hooks.chpwd(cwd).finally(std.restore).then(function() {
          expect(std.out).to.be.empty;
          expect(std.cmd).to.be.empty;
          expect(std.err).to.eql('avn could not activate node 0.10.26\n');
        });
      });

      it('fails when plugin throws', function() {
        var std = capture();
        plugin = {
          name: 'test',
          match: function() { throw new Error('test'); }
        };
        setupExample('v0.10.26');
        return avn.hooks.chpwd(cwd).finally(std.restore).then(function() {
          expect(std.out).to.be.empty;
          expect(std.cmd).to.be.empty;
          expect(std.err).to.eql('avn could not activate node 0.10.26\n');
        });
      });

      it('handles plugin throwing errors', function() {
        var std = capture();
        plugin = {
          name: 'test',
          match: function() { throw new Error('test'); }
        };
        setupExample('v0.10.26');
        return avn.hooks.chpwd(cwd, { verbose: true }).finally(std.restore).then(function() {
          expect(std.out).to.be.empty;
          expect(std.cmd).to.be.empty;
          expect(std.err).to.eql('avn could not activate node 0.10.26\n' +
            'error: no plugin passed predicate\n  test: test\n');
        });
      });

      it('expects plugins to return object containing command', function() {
        var std = capture();
        plugin = {
          name: 'test',
          match: function() { return { version: 'n' }; }
        };
        setupExample('v0.10.26');
        return avn.hooks.chpwd(cwd, { verbose: true }).finally(std.restore).then(function() {
          expect(std.out).to.be.empty;
          expect(std.cmd).to.be.empty;
          expect(std.err).to.eql('avn could not activate node 0.10.26\n' +
            'error: no plugin passed predicate\n  test: result missing command\n');
        });
      });

      it('expects plugins to return object containing version', function() {
        var std = capture();
        plugin = {
          name: 'test',
          match: function() { return { command: 'activate n' }; }
        };
        setupExample('v0.10.26');
        return avn.hooks.chpwd(cwd, { verbose: true }).finally(std.restore).then(function() {
          expect(std.out).to.be.empty;
          expect(std.cmd).to.be.empty;
          expect(std.err).to.eql('avn could not activate node 0.10.26\n' +
            'error: no plugin passed predicate\n  test: result missing version\n');
        });
      });

      it('requires stdcmd stream to work', function() {
        var std = capture(['out', 'err']);
        setupExample('v0.10.26');
        return avn.hooks.chpwd(cwd)
        .catch(function(e) {
          expect(e.message).to.match(/^cannot (call|read) (method|property) \'write\' of undefined$/i);
        })
        .finally(std.restore);
      });
    });
  });
});
