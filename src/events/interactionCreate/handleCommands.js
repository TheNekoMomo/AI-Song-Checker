// @ts-check

const { devs, testServer, guildWhitelistIDs } = require('../../../config.json');
const getLocalCommands = require('../../utils/getLocalCommands');

/** @typedef {import('../../types').EventFileHandler} EventFileHandler */

/** 
 * @type {EventFileHandler} 
 * @param {import('discord.js').Client} client
 * @param {import('discord.js').Interaction} interaction
*/
async function  handleCommands (client, interaction)
{
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.inGuild()) return;

    const localCommands = getLocalCommands();

    try 
    {
        const commandObject = localCommands.find((cmd) => cmd.name === interaction.commandName);

        if (!commandObject) return;

        if (!guildWhitelistIDs.includes(interaction.guildId))
        {
            interaction.reply({content: 'This server is not on the whitelist to use any command.', ephemeral: true});
            return;
        }

        if (commandObject.devOnly)
        {
            if (!devs.includes(interaction.user.id))
            {
                interaction.reply({content: 'Only developers are allowed to run this command.', ephemeral: true});
                return;
            }
        }
        if (commandObject.testOnly)
        {
            if (interaction.guildId !== testServer)
            {
                interaction.reply({content: 'This command cannot be ran here.', ephemeral: true});
                return;
            }
        }

        if (commandObject.permissionsRequired?.length)
        {
            for (let permission of commandObject.permissionsRequired)
            {
                if (!interaction.memberPermissions.has(permission))
                {
                    interaction.reply({content: 'You do not have permission to run this command.', ephemeral: true});
                    break;
                }
            }
        }
        if (commandObject.botPermissions?.length)
        {
            for (let permission of commandObject.botPermissions)
            {
                const bot = interaction.guild?.members.me;
                if (bot && !bot.permissions.has(permission))
                {
                    interaction.reply({content: 'I do not have permission to run this command.', ephemeral: true});
                    break;
                }
            }
        }

        await commandObject.callback(client, interaction);
    } 
    catch (error) {
        console.log(`There was an error running this command: ${error}`);
    }
};

module.exports = handleCommands;