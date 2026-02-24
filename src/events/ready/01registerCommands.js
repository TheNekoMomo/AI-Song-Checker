// @ts-check

const { testServer } = require('../../../config.json');
const getApplicationCommands = require('../../utils/getApplicationCommands');
const getLocalCommands = require('../../utils/getLocalCommands');
const areCommandsDifferent = require('../../utils/areCommandsDifferent');

/** @typedef {import('../../types').EventFileHandler} EventFileHandler */

/** @type {EventFileHandler} */
module.exports = async (client) => {
    try 
    {
        const localCommands = getLocalCommands();
        const applicationCommands = await getApplicationCommands(client);

        for (let localCommand of localCommands)
        {
            const { name, description, options } = localCommand;

            const existingCommand = await applicationCommands?.cache.find((cmd) => cmd.name === name);
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
        console.log(`There was ana error: ${error}`);
    }
};