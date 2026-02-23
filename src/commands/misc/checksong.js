// @ts-check
/** @typedef {import('../../types').Command} Command */

const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');

/** @type {Command} */
module.exports = {
    name: 'check-song',
    description: 'checks a song',
    //devOnly: Boolean,
    //testOnly: Boolean,
    options: [
        {
            name: 'song-url',
            description: 'song',
            required: true,
            type: ApplicationCommandOptionType.String,
        },
    ],
    
    /**
   * @param {import('discord.js').Client} client
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
    callback: (client, interaction) => {
        interaction.reply(`hey`);
    }
}