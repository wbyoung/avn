'use strict';

/**
 * Check if an error error code is `ENOENT`.
 *
 * @private
 * @function hooks.isNoEntry
 * @param {Error} error The error to check.
 */
exports.isNoEntry = function(e) { return e.code === 'ENOENT'; };
