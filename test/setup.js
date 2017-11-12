'use strict';

require('./helpers');

var Promise = require('bluebird');
var npm = Promise.promisifyAll(require('npm'));
var path = require('path');
var chalk = require('chalk');
var setup = require('../lib/setup');
var install = require('../lib/setup/install').all;
var updateProfile = require('../lib/setup/profile').update;
var updateConfigurationFile = require('../lib/setup/config').update;
var childProcess = require('child_process');
var temp = require('temp').track();
var fs = require('mz/fs');

var spawn = childProcess.spawn;
var stubSpawn = function() {
  return sinon.stub(childProcess, 'spawn', function() {
    var args = Array.prototype.slice.call(arguments);
    var cmdArgs = args.pop().slice();
    var src = path.join(__dirname, '..', 'plugins');
    var dst = cmdArgs.pop();
    return spawn('/bin/cp', ['-RL', src, dst]);
  });
};

var capture = require('./helpers').capture;
var fillTemporaryHome = function(temporaryHome, source) {
  return new Promise(function(resolve, reject) {
    var fullSource = path.resolve(path.join(__dirname, 'fixtures', source)) + '/.';
    var cmd = spawn('/bin/cp', ['-RL', fullSource, temporaryHome]);
    cmd.stdout.pipe(process.stdout);
    cmd.stderr.pipe(process.stderr);
    cmd.on('close', function(code) {
      if (code === 0) { resolve(); }
      else { reject(new Error('cp exited with status: ' + code)); }
    });
  });
};

var setupNPM = function() {
  var prefix = path.resolve(path.join(__dirname, '../test/fixtures/node_install'));
  return npm.loadAsync({ global: true, progress: false }).then(function() {
    npm.prefix = prefix;
  });
};

describe('avn setup', function() {
  var temporaryHome;
  var home = process.env.HOME;
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
  });

  afterEach(function() {
    process.env.HOME = home;
    temp.cleanup();
  });

  it('creates .bash_profile', function() {
    var std = capture(['out', 'err']);
    return fillTemporaryHome(temporaryHome, 'home_empty')
    .then(function() { return updateProfile(); }).finally(std.restore).then(function() {
      expect(fs.existsSync(path.join(temporaryHome, '.bash_profile'))).to.be.true;
      expect(std.out).to.eql(
        'avn: profile setup complete (~/.bash_profile)\n' +
        'avn: restart your terminal to start using avn\n');
      expect(std.err).to.eql('');
    });
  });

  it('appends to .bash_profile', function() {
    var std = capture(['out', 'err']);
    return fillTemporaryHome(temporaryHome, 'home_with_bash_profile')
    .then(function() { return updateProfile(); })
    .finally(std.restore)
    .then(function() {
      var file = path.join(temporaryHome, '.bash_profile');
      var contents = fs.readFileSync(file, 'utf8');
      expect(contents).to.contain('avn');
      expect(contents).to.contain('alias grep');
      expect(std.out).to.eql(
        'avn: profile setup complete (~/.bash_profile)\n' +
        'avn: restart your terminal to start using avn\n');
      expect(std.err).to.eql('');
    });
  });

  it('leaves .bash_profile untouched', function() {
    var std = capture(['out', 'err']);
    return fillTemporaryHome(temporaryHome, 'home_with_avn_bash_profile')
    .then(function() { return updateProfile(); })
    .finally(std.restore)
    .then(function() {
      var file = path.join(temporaryHome, '.bash_profile');
      var contents = fs.readFileSync(file, 'utf8');
      expect(contents).to.contain('avn');
      expect(contents.split().length).to.eql(1);
      expect(std.out).to.eql(
        'avn: profile already set up (~/.bash_profile)\n');
      expect(std.err).to.eql('');
    });
  });

  it('errors if .bash_profile cannot be written', function() {
    var profile = path.join(temporaryHome, '.bash_profile');
    var std = capture(['out', 'err']);
    return fillTemporaryHome(temporaryHome, 'home_with_bash_profile')
    .then(function() { return fs.chmod(profile, '0400'); })
    .then(function() { return updateProfile(); })
    .then(function() { throw new Error('Expected error thrown'); }, function(e) {
      expect(std.out).to.eql('');
      expect(std.err).to.eql('');
      expect(e.code).to.eql('EACCES');
    })
    .finally(std.restore);
  });

  it('updates .zshrc without creating .bash_profile', function() {
    var std = capture(['out', 'err']);
    return fillTemporaryHome(temporaryHome, 'home_with_zsh')
    .then(function() { return updateProfile(); }).finally(std.restore).then(function() {
      var file = path.join(temporaryHome, '.zshrc');
      var contents = fs.readFileSync(file, 'utf8');
      expect(contents).to.contain('avn');
      expect(contents).to.contain('alias grep');
      expect(fs.existsSync(path.join(temporaryHome, '.bash_profile'))).to.be.false;
      expect(std.out).to.eql(
        'avn: profile setup complete (~/.zshrc)\n' +
        'avn: restart your terminal to start using avn\n');
      expect(std.err).to.eql('');
    });
  });

  it('updates .zshrc and .bash_profile', function() {
    var std = capture(['out', 'err']);
    return fillTemporaryHome(temporaryHome, 'home_with_bash_profile_and_zsh')
    .then(function() { return updateProfile(); }).finally(std.restore).then(function() {
      var file = path.join(temporaryHome, '.bash_profile');
      var contents = fs.readFileSync(file, 'utf8');
      expect(contents).to.contain('avn');
      expect(contents).to.contain('alias grep');
      file = path.join(temporaryHome, '.zshrc');
      contents = fs.readFileSync(file, 'utf8');
      expect(contents).to.contain('avn');
      expect(contents).to.contain('alias grep');
      expect(std.out.split('\n').sort()).to.eql(['',
        'avn: profile setup complete (~/.bash_profile)',
        'avn: profile setup complete (~/.zshrc)',
        'avn: restart your terminal to start using avn']);
      expect(std.err).to.eql('');
    });
  });

  it('installs to ~/.avn', function() {
    var spawn = stubSpawn();
    var std = capture(['out', 'err']);
    return fillTemporaryHome(temporaryHome, 'home_empty').then(setupNPM)
    .then(function() { npm.prefix = '/path/to/nowhere'; })
    .then(function() { return install(); })
    .finally(function() {
      try { spawn.restore(); }
      catch(e) {}
    })
    .finally(std.restore)
    .then(function() {
      var src = path.resolve(path.join(__dirname, '..')) + '/';
      var dst = path.join(process.env.HOME, '.avn');
      expect(spawn).to.have.been.calledOnce;
      expect(spawn).to.have.been.calledWith('/bin/cp', ['-RL', src, dst]);
      expect(std.out).to.eql('avn: installation complete\n');
      expect(std.err).to.eql('');
    });
  });

  it('installs plugins to ~/.avn', function() {
    var spawn = stubSpawn();
    var std = capture(['out', 'err']);
    return fillTemporaryHome(temporaryHome, 'home_avn_some_plugins').then(setupNPM)
    .then(function() { return install(); })
    .finally(function() {
      try { spawn.restore(); }
      catch(e) {}
    })
    .finally(std.restore)
    .then(function() {
      var src = path.resolve(path.join(__dirname, '..')) + '/';
      var dst = path.join(process.env.HOME, '.avn');
      expect(spawn).to.be.calledTwice;
      expect(spawn).to.have.been.calledWith('/bin/cp', ['-RL', src, dst]);
      src = path.resolve(path.join(__dirname, 'fixtures/node_install/lib/node_modules/avn-plugin')) + '/';
      dst = path.join(process.env.HOME, '.avn/plugins/avn-plugin');
      expect(spawn).to.have.been.calledWith('/bin/cp', ['-RL', src, dst]);
      expect(std.out).to.eql('avn: installation complete\n' +
        'avn-plugin: installation complete\n');
      expect(std.err).to.eql('');
    });
  });


  it('updates ~/.avn install if installed version is old', function() {
    var spawn = stubSpawn();
    var std = capture(['out', 'err']);
    return fillTemporaryHome(temporaryHome, 'home_avn_outdated').then(setupNPM)
    .then(function() { npm.prefix = '/path/to/nowhere'; })
    .then(function() { return install(); })
    .finally(function() {
      try { spawn.restore(); }
      catch(e) {}
    })
    .finally(std.restore)
    .then(function() {
      var src = path.resolve(path.join(__dirname, '..')) + '/';
      var dst = path.join(process.env.HOME, '.avn');
      expect(spawn).to.have.been.calledOnce;
      expect(spawn).to.have.been.calledWith('/bin/cp', ['-RL', src, dst]);
      expect(std.out).to.eql('avn: installation updated\n');
      expect(std.err).to.eql('');
    });
  });

  it('updates ~/.avn install if installed version is futuristic', function() {
    var spawn = stubSpawn();
    var std = capture(['out', 'err']);
    return fillTemporaryHome(temporaryHome, 'home_avn_futuristic').then(setupNPM)
    .then(function() { npm.prefix = '/path/to/nowhere'; })
    .then(function() { return install(); })
    .finally(function() {
      try { spawn.restore(); }
      catch(e) {}
    })
    .finally(std.restore).then(function() {
      var src = path.resolve(path.join(__dirname, '..')) + '/';
      var dst = path.join(process.env.HOME, '.avn');
      expect(spawn).to.have.been.calledOnce;
      expect(spawn).to.have.been.calledWith('/bin/cp', ['-RL', src, dst]);
      expect(std.out).to.eql('avn: installation updated\n');
      expect(std.err).to.eql('');
    });
  });

  it('skips ~/.avn install if current version is installed', function() {
    var spawn = stubSpawn();
    var std = capture(['out', 'err']);
    return fillTemporaryHome(temporaryHome, 'home_avn_current').then(setupNPM)
    .then(function() { npm.prefix = '/path/to/nowhere'; })
    .then(function() { return install(); })
    .finally(function() {
      try { spawn.restore(); }
      catch(e) {}
    })
    .finally(std.restore).then(function() {
      expect(spawn).to.not.have.been.called;
      expect(std.out).to.eql('');
      expect(std.err).to.eql('');
    });
  });

  it('fails ~/.avn install if home directory is not writable', function() {
    var spawn = stubSpawn();
    var std = capture(['out', 'err']);
    return fs.chmod(temporaryHome, 600)
    .then(function() { npm.prefix = '/path/to/nowhere'; })
    .then(function() { return install(); })
    .then(function() { throw new Error('Expected error thrown'); }, function(e) {
      expect(e).to.match(/cp exited with status: 1/);
    })
    .finally(function() {
      try { spawn.restore(); }
      catch(e) {}
    })
    .finally(std.restore);
  });

  it('creates ~/.avnrc', function() {
    var std = capture(['out', 'err']);
    return fillTemporaryHome(temporaryHome, 'home_empty').then(setupNPM)
    .then(function() { return updateConfigurationFile(); }).finally(std.restore).then(function() {
      var file = path.join(temporaryHome, '.avnrc');
      var contents = fs.readFileSync(file, 'utf8');
      var rc = JSON.parse(contents);
      expect(std.out).to.eql('avn: configuration complete (~/.avnrc)\n');
      expect(std.err).to.eql('');
      expect(rc).to.eql({ plugins: ['bad', 'bad-require', 'bad-require-custom-throw', 'plugin'] });
    });
  });

  it('updates ~/.avnrc', function() {
    var std = capture(['out', 'err']);
    return fillTemporaryHome(temporaryHome, 'home_avnrc_missing_plugins').then(setupNPM)
    .then(function() { return updateConfigurationFile(); }).finally(std.restore).then(function() {
      var file = path.join(temporaryHome, '.avnrc');
      var contents = fs.readFileSync(file, 'utf8');
      var rc = JSON.parse(contents);
      expect(std.out).to.eql('avn: configuration updated (~/.avnrc)\n');
      expect(std.err).to.eql('');
      expect(rc).to.eql({ plugins: ['custom', 'bad', 'bad-require', 'bad-require-custom-throw', 'plugin'] });
    });
  });

  it('leaves ~/.avnrc untouched', function() {
    var std = capture(['out', 'err']);
    return fillTemporaryHome(temporaryHome, 'home_avnrc_plugins_current').then(setupNPM)
    .then(function() { return updateConfigurationFile(); }).finally(std.restore).then(function() {
      var file = path.join(temporaryHome, '.avnrc');
      var contents = fs.readFileSync(file, 'utf8');
      var rc = JSON.parse(contents);
      expect(std.out).to.eql('avn: configuration unchanged (~/.avnrc)\n');
      expect(std.err).to.eql('');
      expect(rc).to.eql({ plugins: ['plugin', 'bad', 'bad-require', 'bad-require-custom-throw'] });
    });
  });

  it('runs all actions together', function() {
    var spawn = stubSpawn();
    var std = capture(['out', 'err']);
    return fillTemporaryHome(temporaryHome, 'home_empty').then(setupNPM)
    .then(function() { npm.prefix = '/path/to/nowhere'; })
    .then(function() { return setup(); })
    .finally(function() {
      try { spawn.restore(); }
      catch(e) {}
    })
    .finally(std.restore)
    .then(function() {
      expect(spawn).to.have.been.called;
      expect(fs.existsSync(path.join(temporaryHome, '.bash_profile'))).to.be.true;
      expect(fs.existsSync(path.join(temporaryHome, '.avnrc'))).to.be.true;
      expect(std.out.split('\n').sort()).to.eql([
        '',
        'avn: configuration complete (~/.avnrc)',
        'avn: installation complete',
        'avn: profile setup complete (~/.bash_profile)',
        'avn: restart your terminal to start using avn'
      ]);
      expect(std.err).to.eql('');
    });
  });

  it('fails for any failed action', function() {
    var profile = path.join(temporaryHome, '.bash_profile');
    var spawn = stubSpawn();
    var std = capture(['out', 'err']);
    return fillTemporaryHome(temporaryHome, 'home_with_bash_profile').then(setupNPM)
    .then(function() { return fs.chmod(profile, '0400'); })
    .then(function() { npm.prefix = '/path/to/nowhere'; })
    .then(function() { return setup(); })
    .finally(function() {
      try { spawn.restore(); }
      catch(e) {}
    })
    .finally(std.restore)
    .then(function() {
      expect(spawn).to.have.been.called;
      expect(fs.existsSync(path.join(temporaryHome, '.bash_profile'))).to.be.true;
      expect(fs.existsSync(path.join(temporaryHome, '.avnrc'))).to.be.true;
      expect(std.out.split('\n').sort()).to.eql([
        '',
        'avn: configuration complete (~/.avnrc)',
        'avn: installation complete',
      ]);
      expect(std.err).to.match(/^error: EACCES.*, open '[\/\w-\d\.]*\/.bash_profile'\n$/);
    });
  });
});
