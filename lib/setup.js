var q = require('q');
var chalk = require('chalk');

module.exports = function() {
  return q.allSettled([
    require('./setup/install').all(),
    require('./setup/profile').update(),
    require('./setup/config').update()
  ])
  .then(function(results) {
    var errors = results
    .filter(function(r) { return r.state !== 'fulfilled'; })
    .map(function(r) { return r.reason.message; });

    if (errors.length) {
      console.error('%s: %s', chalk.bold.red('error'), errors.join(', '));
    }
  });
};
