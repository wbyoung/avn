/* jshint expr: true */
/* global before, beforeEach, after */

var _ = require('lodash');
var q = require('q');
var avn = require('..');
var path = require('path');
var chalk = require('chalk');
var setup = require('../lib/setup');
var child_process = require('child_process');
var temp = require('temp').track();
var fs = require('fs');
var fsq = {
  mkdir: q.denodeify(fs.mkdir)
};

var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));

var capture = require('./helpers').capture;
var fillTemporaryHome = function(temporaryHome, source) {
  var deferred = q.defer();
  var fullSource = path.resolve(path.join(__dirname, 'examples', source)) + '/';
  var cmd = child_process.spawn('/bin/cp', ['-RL', fullSource, temporaryHome]);
  cmd.stdout.pipe(process.stdout);
  cmd.stderr.pipe(process.stderr);
  cmd.on('close', function(code) {
    if (code === 0) { deferred.resolve(); }
    else { deferred.reject(new Error('cp exited with status: ' + code)); }
  });
  return deferred.promise;
};

describe('avn setup', function() {
  var temporaryHome;
  var home = process.env.HOME;
  var nodePath = process.env.NODE_PATH;
  var chalkEnabled = chalk.enabled;

  before(function() {
    chalk.enabled = false;
  });

  after(function() {
    chalk.enabled = chalkEnabled;
  });

  beforeEach(function() {
    temporaryHome = temp.mkdirSync();
    process.env.HOME = temporaryHome;
    process.env.NODE_PATH = path.resolve(path.join(__dirname, 'examples/node_install/node_modules'));
    require('module')._initPaths();
  });

  afterEach(function() {
    process.env.HOME = home;
    process.env.NODE_PATH = nodePath;
    require('module')._initPaths();
    temp.cleanup();
  });

  it('creates .bash_profile', function(done) {
    var std = capture(['out', 'err']);
    fillTemporaryHome(temporaryHome, 'home_empty')
    .then(function() { return setup._updateProfile(); }).fin(std.restore).done(function() {
      expect(fs.existsSync(path.join(temporaryHome, '.bash_profile'))).to.be.true;
      expect(std.out).to.eql(
        'avn: profile setup complete (~/.bash_profile)\n' +
        'avn: restart your terminal to start using avn\n');
      expect(std.err).to.eql('');
      done();
    });
  });

  // TODO: make this work on Travis
  it.skip('appends to .bash_profile', function(done) {
    var std = capture(['out', 'err']);
    fillTemporaryHome(temporaryHome, 'home_with_bash_profile')
    .then(function() { return setup._updateProfile(); })
    .fin(std.restore)
    .done(function() {
      var file = path.join(temporaryHome, '.bash_profile');
      var contents = fs.readFileSync(file, 'utf8');
      expect(contents).to.contain('avn');
      expect(contents).to.contain('alias grep');
      expect(std.out).to.eql(
        'avn: profile setup complete (~/.bash_profile)\n' +
        'avn: restart your terminal to start using avn\n');
      expect(std.err).to.eql('');
      done();
    });
  });

  // TODO: make this work on Travis
  it.skip('leaves .bash_profile untouched', function(done) {
    var std = capture(['out', 'err']);
    fillTemporaryHome(temporaryHome, 'home_with_avn_bash_profile')
    .then(function() { return setup._updateProfile(); })
    .fin(std.restore)
    .done(function() {
      var file = path.join(temporaryHome, '.bash_profile');
      var contents = fs.readFileSync(file, 'utf8');
      expect(contents).to.contain('avn');
      expect(contents.split().length).to.eql(1);
      expect(std.out).to.eql(
        'avn: profile already set up (~/.bash_profile)\n');
      expect(std.err).to.eql('');
      done();
    });
  });

  it('errors if .bash_profile cannot be written', function(done) {
    var std = capture(['out', 'err']);
    fillTemporaryHome(temporaryHome, 'home_with_protected_bash_profile')
    .then(function() { return setup._updateProfile(); })
    .catch(function(e) {
      expect(std.out).to.eql('');
      expect(std.err).to.eql('');
      expect(e.code).to.eql('EACCES');
    })
    .fin(std.restore)
    .done(function() { done(); });
  });

  it.skip('installs to ~/.avn', function(done) {
    var std = capture(['out', 'err']);
    fillTemporaryHome(temporaryHome, 'home_empty')
    .then(function() { return setup._install(); }).fin(std.restore).done(function() {
      // make assertions
      done();
    });
  });

  it.skip('updates ~/.avn install', function(done) {
    var std = capture(['out', 'err']);
    fillTemporaryHome(temporaryHome, 'home_avn_outdated')
    .then(function() { return setup._install(); }).fin(std.restore).done(function() {
      // make assertions
      done();
    });
  });

  it.skip('updates ~/.avn install', function(done) {
    var std = capture(['out', 'err']);
    fillTemporaryHome(temporaryHome, 'home_avn_futuristic')
    .then(function() { return setup._install(); }).fin(std.restore).done(function() {
      // make assertions
      done();
    });
  });

  it.skip('creates ~/.avnrc', function(done) {
    var std = capture(['out', 'err']);
    fillTemporaryHome(temporaryHome, 'home_empty')
    .then(function() { return setup._updateConfigurationFile(); }).fin(std.restore).done(function() {
      // make assertions
      done();
    });
  });

  it.skip('updates ~/.avnrc', function(done) {
    var std = capture(['out', 'err']);
    fillTemporaryHome(temporaryHome, 'home_avnrc_missing_plugins')
    .then(function() { return setup._updateConfigurationFile(); }).fin(std.restore).done(function() {
      // make assertions
      done();
    });
  });

  it.skip('leaves ~/.avnrc untouched', function(done) {
    var std = capture(['out', 'err']);
    fillTemporaryHome(temporaryHome, 'home_avnrc_plugins_current')
    .then(function() { return setup._updateConfigurationFile(); }).fin(std.restore).done(function() {
      // make assertions
      done();
    });
  });

  it.skip('runs all actions together', function(done) {
    var std = capture(['out', 'err']);
    fillTemporaryHome(temporaryHome, 'home_empty')
    .then(function() { return setup(); }).fin(std.restore).done(function() {
      // make assertions
      done();
    });
  });
});
