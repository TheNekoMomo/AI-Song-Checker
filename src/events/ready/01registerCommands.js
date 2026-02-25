// @ts-check
require('dotenv').config();

const { testServer } = require('../../../config.json');
const getApplicationCommands = require('../../utils/getApplicationCommands');
const getLocalCommands = require('../../utils/getLocalCommands');
const areCommandsDifferent = require('../../utils/areCommandsDifferent');

/** @typedef {import('../../types').EventFileHandler} EventFileHandler */

function isTestBuild() {
  const raw = (process.env.TEST_BUILD || '').trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes' || raw === 'y';
}

/** @type {EventFileHandler} */
module.exports = async (client) => {
    try 
    {
        // If TEST_BUILD=true -> guild commands in testServer
        // Else -> global commands
        const guildId = isTestBuild() ? testServer : undefined;

        const localCommands = getLocalCommands();
        const applicationCommands = await getApplicationCommands(client, guildId);

        for (let localCommand of localCommands)
        {
            const { name, description, options } = localCommand;

            const existingCommand = applicationCommands?.cache.find((cmd) => cmd.name === name);
            if (existingCommand)
            {
                if (localCommand.deleted)
                {
                    await applicationCommands?.delete(existingCommand.id);
                    console.log(`Deleted command "${name}".`);
                }
                else if (areCommandsDifferent(existingCommand, localCommand))
                {
                    await applicationCommands?.edit(existingCommand.id, {description, options: /** @type {any} */ (localCommand.options)});
                    console.log(`Edited command "${name}".`);
                }
                else
                {
                    console.log(`Command "${name}" already registered.`);
                }
            }
            else
            {
                if (localCommand.deleted)
                {
                    console.log(`Skipping command "${name}" as it is set to be deleted.`);
                    continue;
                }

                await applicationCommands?.create({name, description, options: /** @type {any} */ (localCommand.options)});
                console.log(`Creating command "${name}".`);
            }
        }
    }
    catch (error) 
    {
        console.log(`There was an error: ${error}`);
    }
};