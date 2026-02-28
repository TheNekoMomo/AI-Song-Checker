// @ts-check
const fs = require('fs');
const path = require('path');

/**
 * Checks for the existence of a marker file that only exists on your
 * development machine.  If the file is present, we treat the process
 * as "local"; if it's missing (e.g. on a deployed server), the
 * function returns false.
 *
 * Create the marker on your laptop, for example:
 *
 *   cd /path/to/AI-Song-Checker
 *   touch .local_marker
 *
 * and make sure you don't commit it to git (ignore it via .gitignore).
 *
 * @returns {boolean}
 */
function isLocal() {
  // marker file lives in the project root alongside package.json.
  // `process.cwd()` is used rather than `__dirname` so that the
  // helper still works even when modules are required from elsewhere
  // (e.g. during tests).
  const markerPath = path.resolve(process.cwd(), '.local_marker');
  try {
    return fs.existsSync(markerPath);
  } catch (err) {
    // if something goes wrong reading the fs, assume not local
    return false;
  }
}

module.exports = { isLocal };
