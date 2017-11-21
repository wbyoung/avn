'use strict';

/**
 * Check if an error error code is `ENOENT`.
 *
 * @private
 * @function hooks.isNoEntry
 * @param {Error} e The error to check.
 * @return {Boolean} Whether the error code is `ENOENT`.
 */
exports.isNoEntry = function(e) { return e.code === 'ENOENT'; };
