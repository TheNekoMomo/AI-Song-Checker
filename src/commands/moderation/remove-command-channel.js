// @ts-check
/** @typedef {import('../../types').Command} Command */

const { PermissionFlagsBits, ApplicationCommandOptionType, ChannelType, MessageFlags  } = require("discord.js");
const GuildConfig = require("../../models/GuildConfig");

/** @type {Command} */
module.exports = {
    name: 'remove-command-channel',
    description: 'Removes a channel from the list of channels where the bot will respond to commands.',
    options: [
        {
            name: 'channel',
            description: 'The channel to remove',
            required: true,
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
        },
    ],
    permissionsRequired: [PermissionFlagsBits.ManageGuild],
    deleted: true,
    
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
            { $pull: { allowedChannels: channel.id } },
            { new: true }
        );

        return interaction.reply({ content: `Removed ${channel} from the list of allowed channels.`, flags: MessageFlags.Ephemeral });
    }
};