'use strict';

require('./helpers');

var _ = require('lodash');
var Promise = require('bluebird');
var path = require('path');
var plugins = require('../lib/plugins');

describe('avn plugins', function() {
  var home = process.env.HOME;
  var nodePath = process.env.NODE_PATH;

  beforeEach(function() {
    process.env.HOME = path.resolve(path.join(__dirname, 'fixtures/home'));
    process.env.NODE_PATH = path.resolve(path.join(__dirname, 'fixtures/node_install/lib/node_modules'));
    require('module')._initPaths();
  });
  afterEach(function() {
    process.env.HOME = home;
    process.env.NODE_PATH = nodePath;
    require('module')._initPaths();
  });

  it('lists all plugins', function() {
    return Promise.map(plugins._all(), _.property('name'))
    .should.eventually.contain('avn-plugin');
  });

  it('works with no config file', function() {
    process.env.HOME = path.resolve(path.join(__dirname, 'fixtures/home_empty'));
    return Promise.map(plugins._all(), _.property('name'))
    .should.not.eventually.be.defined;
  });

  it('ignores missing plugins', function() {
    process.env.HOME = path.resolve(path.join(__dirname, 'fixtures/home_missing'));
    return Promise.map(plugins._all(), _.property('name'))
    .should.not.eventually.contain('avn-missing');
  });

  it('throws for plugins with syntax errors', function() {
    process.env.HOME = path.resolve(path.join(__dirname, 'fixtures/home_error'));
    return plugins._all().should.eventually.be
    .rejectedWith(/unexpected_identifier is not defined/i);
  });

  it('throws for plugins with load errors', function() {
    process.env.HOME = path.resolve(path.join(__dirname, 'fixtures/home_require_error'));
    return plugins._all().should.eventually.be
    .rejectedWith(/cannot find module '([^']*)'/i);
  });

  it('throws for plugins with load errors (after msg change)', function() {
    process.env.HOME = path.resolve(path.join(__dirname, 'fixtures/home_require_error_custom'));
    return plugins._all().should.eventually.be
    .rejectedWith(/cannot find a module/i);
  });

  it('caches results', function() {
    expect(plugins.all() !== plugins._all()).to.be.true;
    expect(plugins.all() === plugins.all()).to.be.true;
  });
});
