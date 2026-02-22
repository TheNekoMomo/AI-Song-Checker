// @ts-check
/** @typedef {import('../../types').Command} Command */

/** @type {Command} */
module.exports = {
    name: 'ping',
    description: 'Pong!',
    //devOnly: Boolean,
    //testOnly: Boolean,
    //options: Object[],
    //permissionsRequired: [PermissionFlagsBits.Administrator],
    //botPermissions: [PermissionFlagsBits.Administrator],
    //deleted: Boolean
    
    /**
   * @param {import('discord.js').Client} client
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
    callback: (client, interaction) => {
        interaction.reply(`Pong! ${client.ws.ping}ms`);
    }
}