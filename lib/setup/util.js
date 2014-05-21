var q = require('q');
var fs = require('fs');

module.exports.write = function(file, data, opts) {
  return q.promise(function(resolve, reject) {
    var stream = fs.createWriteStream(file, opts);
    stream.on('error', function(err) { reject(err); });
    stream.on('finish', function() { resolve(); });
    stream.end(data);
  });
};
