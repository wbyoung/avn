
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
