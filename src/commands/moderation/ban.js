// @ts-check
/** @typedef {import('../../types').Command} Command */

const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');

/** @type {Command} */
module.exports = {
    name: 'ban',
    description: '100% bans a member from the server.',
    //devOnly: Boolean,
    //testOnly: Boolean,
    options: [
        {
            name: 'target-user',
            description: 'The user to ban.',
            required: true,
            type: ApplicationCommandOptionType.Mentionable,
        },
        {
            name: 'reason',
            description: 'The reason for banning.',
            required: false, //Can be removed altogether
            type: ApplicationCommandOptionType.String,
        },
    ],
    permissionsRequired: [PermissionFlagsBits.Administrator],
    botPermissions: [PermissionFlagsBits.Administrator],

    /**
   * @param {import('discord.js').Client} client
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   */
    callback: async (client, interaction) => {
        const targetUserID = interaction.options.get('target-user');
        const reason = interaction.options.get('reason')?.value || 'No reason provided';

        await interaction.deferReply();

        interaction.editReply(`Banned.. ${targetUserID?.user?.username} for ${reason}`);
    }
}