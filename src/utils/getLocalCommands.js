// @ts-check
const path = require('path');
const getAllFiles = require('./getAllFiles');

/** @typedef {import('../types').Command} Command */
/** @typedef {import('../types').CommandOption} CommandOption */

/**
 * Load all local command modules from `src/commands/
 *
 * @param {string[]} [exceptions=[]] - Command names to skip.
 * @returns {Command[]} The loaded command objects.
 */
function getLocalCommands(exceptions = []) 
{
  /** @type {Command[]} */
  const localCommands = [];

  const commandCategories = getAllFiles(path.join(__dirname, '..', 'commands'), true);

  for (const commandCategory of commandCategories) 
  {
    const commandFiles = getAllFiles(commandCategory);

    for (const commandFile of commandFiles) 
    {
      // Dynamic require is fine in CJS; disable lint warnings if you use ESLint:
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const commandObject = require(commandFile);

      if (!commandObject || !commandObject.name) continue;
      if (exceptions.includes(commandObject.name)) continue;

      localCommands.push(/** @type {Command} */ (commandObject));
    }
  }

  return localCommands;
}

module.exports = getLocalCommands;
