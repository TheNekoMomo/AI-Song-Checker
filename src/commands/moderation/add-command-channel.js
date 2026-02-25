// @ts-check
/** @typedef {import('../../types').Command} Command */

const { PermissionFlagsBits, ApplicationCommandOptionType, ChannelType, MessageFlags  } = require("discord.js");
const GuildConfig = require("../../models/GuildConfig");

/** @type {Command} */
module.exports = {
    name: 'add-command-channel',
    description: 'Adds a channel to the list of channels where the bot will respond to commands.',
    options: [
        {
            name: 'channel',
            description: 'The channel to add',
            required: true,
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
        },
    ],
    permissionsRequired: [PermissionFlagsBits.ManageGuild],

    /**
     * @param {import('discord.js').Client} client
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    callback: async (client, interaction) => {
        if(!interaction.inGuild() || !interaction.guildId) {
            return interaction.reply({ content: "This command can only be used in a server.", flags: MessageFlags.Ephemeral });
        }

        const channel = interaction.options.getChannel('channel', true);

        if(channel.type !== ChannelType.GuildText) {
            return interaction.reply({ content: "Please select a normal text channel.", flags: MessageFlags.Ephemeral });
        }

        await GuildConfig.findOneAndUpdate(
            { guildId: interaction.guildId },
            { $addToSet: { allowedChannels: channel.id } },
            { upsert: true, returnDocument: 'after' }
        );

        return interaction.reply({ content: `Added ${channel} to the list of allowed channels.`, flags: MessageFlags.Ephemeral });
    }
};