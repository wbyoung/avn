/* jshint expr: true */
/* global before, beforeEach, after */

var avn = require('..');
var path = require('path');
var plugins = require('../lib/plugins');
var _ = require('lodash');

var chai = require('chai');
var expect = chai.expect;
chai.use(require('sinon-chai'));

var capture = require('./helpers').capture;

describe('avn plugins', function() {
  var home = process.env.HOME;
  var nodePath = process.env.NODE_PATH;
  var all = plugins.all();

  beforeEach(function() {
    process.env.HOME = path.resolve(path.join(__dirname, 'examples/home'));
    process.env.NODE_PATH = path.resolve(path.join(__dirname, 'examples/node_install/node_modules'));
    require('module')._initPaths();
  });
  afterEach(function() {
    process.env.HOME = home;
    process.env.NODE_PATH = nodePath;
    require('module')._initPaths();
  });

  it('lists all plugins', function() {
    expect(_.map(plugins._all(), 'name')).to.contain('avn-plugin');
  });

  it('works with no config file', function() {
    process.env.HOME = path.resolve(path.join(__dirname, 'examples/home_empty'));
    expect(_.map(plugins._all(), 'name')).to.be.defined;
  });

  it('ignores missing plugins', function() {
    process.env.HOME = path.resolve(path.join(__dirname, 'examples/home_missing'));
    expect(_.map(plugins._all(), 'name')).not.to.contain('avn-missing');
  });

  it('throws for plugins with syntax errors', function() {
    process.env.HOME = path.resolve(path.join(__dirname, 'examples/home_error'));
    expect(plugins._all).to.throw(/unexpected_identifier is not defined/i);
  });

  it('throws for plugins with load errors', function() {
    process.env.HOME = path.resolve(path.join(__dirname, 'examples/home_require_error'));
    expect(plugins._all).to.throw(/cannot find module '([^']*)'/i);
  });

  it('throws for plugins with load errors (after msg change)', function() {
    process.env.HOME = path.resolve(path.join(__dirname, 'examples/home_require_error_custom'));
    expect(plugins._all).to.throw(/cannot find a module/i);
  });

  it('caches results', function() {
    expect(plugins.all() !== plugins._all()).to.be.true;
    expect(plugins.all() === plugins.all()).to.be.true;
  });
});
