'use strict';

var _ = require('lodash');
var sinon = require('sinon');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chaiAsPromised.transferPromiseness = function (assertion, promise) {
  assertion.then = promise.then.bind(promise);
  assertion.meanwhile = function(value) {
    var result = promise.return(value);
    return _.extend(result, { should: result.should.eventually });
  };
};

chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

global.expect = chai.expect;
global.should = chai.should();
global.sinon = sinon;

exports.capture = function() {
  var args = Array.prototype.slice.call(arguments);
  var restores = [];
  var replay = args.length >= 2 ? args.pop() : false;
  var selections = args.pop() || ['out', 'err', 'cmd'];
  var result = {};

  var stream = function(stream, name, done) {
    var write = stream.write;
    done = done || function() {};
    result[name] = '';
    stream.write = function(data) {
      result[name] += data;
      if (replay && write) {
        write.apply(this, arguments);
      }
    };
    restores.push(function() {
      stream.write = write;
      done();
    });
  };

  var handlers = {
    out: function() {
      return stream(process.stdout, 'out');
    },
    err: function() {
      return stream(process.stderr, 'err');
    },
    cmd: function() {
      var stdcmd = process.stdcmd;
      process.stdcmd = { write: function() {} }; // dummy
      return stream(process.stdcmd, 'cmd', function() {
        process.stdcmd = stdcmd;
      });
    },
  };

  selections.forEach(function(n) {
    handlers[n]();
  });

  result.restore = function() {
    restores.forEach(function(r) { r(); });
    restores = [];
  };

  return result;
};
