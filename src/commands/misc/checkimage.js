// @ts-check
/** @typedef {import('../../types').Command} Command */

const { ApplicationCommandOptionType, EmbedBuilder, ChannelType, MessageFlags } = require('discord.js');
const { getAverageColor } = require("fast-average-color-node");
const { performance } = require('perf_hooks');

const { SightengineAPICall } = require('../../utils/aiAPI');

const GuildConfig = require("../../models/GuildConfig");

/** @type {Command} */
module.exports = {
    name: 'check-image',
    description: 'checks an image against Sightengine for AI-generated content',
    options: [
        {
            name: 'image-url',
            description: 'An image URL to check',
            required: true,
            type: ApplicationCommandOptionType.String,
        },
    ],
    deleted: true, // hide command till work out the API issues
    
    /**
   * @param {import('discord.js').Client} client
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
    callback: async (client, interaction) => {

      // Check if command is used in a guild, in a normal text channel.
      if(!interaction.inGuild() || interaction.channel?.type !== ChannelType.GuildText) {
        return interaction.reply({ content: "This command can only be used in a normal text channel within a guild.", flags: MessageFlags.Ephemeral });
      }

      // Record the start time for performance measurement
      const startTime = performance.now();

      // Defer the reply immediately to allow for processing time
      await interaction.deferReply();

      // Get the image URL from the command options
      const imageURL = interaction.options.getString('image-url', true);

      try {
        // start the Sightengine call immediately
        const sightenginePromise = SightengineAPICall(imageURL)
          .then(res => ({ res, image: imageURL }))
          .catch(e => { console.warn('Sightengine API error', e); return { res: null, image: imageURL }; });

        const startApi = performance.now();

        // fetch guild config and sightengine data in parallel
        const [guildConfig, sightengineWrapped] = await Promise.all([
          GuildConfig.findOne({ guildId: interaction.guildId }),
          sightenginePromise
        ]);

        // Check if the interaction is in a guild and if the channel is allowed
        if (guildConfig && guildConfig.allowedChannels && guildConfig.allowedChannels.length > 0 && !guildConfig.allowedChannels.includes(interaction.channelId)) {
          const allowedChannelsMention = guildConfig.allowedChannels.map(id => `<#${id}>`).join(', ');
          return interaction.editReply({ content: `This command is not allowed in this channel. Please use one of the following channels: ${allowedChannelsMention}` });
        }

        // Determine embed color based on the provided image
        /** @type {any} */
        let embedColor = 'Random';
        try {
          const { hex } = await getAverageColor(imageURL);
          embedColor = parseInt(hex.replace("#", ""), 16);
        } catch (error) {
          console.warn("Failed to get average color from image, using fallback.", error);
        }

        // Extract Sightengine result details
        const sightRes = sightengineWrapped?.res || {};
        const aiProb = (sightRes.type.ai_generated * 100) + '%';

        // Create an embed message to display the results
        const embed = new EmbedBuilder()
          .setTitle('Image Analysis')
          .setDescription(imageURL)
          .setColor(embedColor)
          .setFields({ name: 'AI Generated', value: aiProb, inline: true })
          .setTimestamp();

        embed.setThumbnail(imageURL);

        const endTime = performance.now();
        const totalResponseTime = ((endTime - startTime) / 1000).toFixed(2);
        embed.setFooter({ text: `Total Response Time ${totalResponseTime} seconds` });

        await interaction.editReply({ embeds: [embed] });
      } 
      catch (error) 
      {
        const err = /** @type {any} */ (error);

        const status = err?.response?.status;
        const apiMessage = err?.response?.data?.error || err?.response?.data?.message;

        console.error("[check-image] error:", err?.response?.data ?? err);

        if (status && apiMessage) {
          return interaction.editReply(`error (${status}): ${apiMessage}\nTry again in a moment.`);
        }

        if (status) {
          return interaction.editReply(`error (${status}). Try again in a moment.`);
        }

        return interaction.editReply("An error occurred while checking the image. Try again in a moment.");
      }
    }
}