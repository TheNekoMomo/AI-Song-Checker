// @ts-check
/** @typedef {import('../../types').Command} Command */

const { ApplicationCommandOptionType, EmbedBuilder, ChannelType, MessageFlags } = require('discord.js');
const { getAverageColor } = require("fast-average-color-node");
const { performance } = require('perf_hooks');

const { parseSpotifyTrackURL, getSpotifyTrackInfo } = require('../../utils/spotifyHelper');
const { shlabsSpotifyAPICall, SightengineAPICall } = require('../../utils/aiAPI');

const GuildConfig = require("../../models/GuildConfig");

/** @type {Command} */
module.exports = {
    name: 'check-song',
    description: 'checks a song against shlabs.music for AI-generated content',
    options: [
        {
            name: 'spotify-url',
            description: 'A Spotify Song URL',
            required: true,
            type: ApplicationCommandOptionType.String,
        },
    ],
    
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

      // Get the Spotify URL from the command options
      const songURL = interaction.options.getString('spotify-url', true);

      // Validate and parse the Spotify track URL
      const spotifyResult = parseSpotifyTrackURL(songURL);

      // If the URL is invalid, inform the user and exit
      if (!spotifyResult.valid) {
        return interaction.editReply("Invalid Spotify track URL.");
      }

      try 
      {
        // Make the SHLabs Promise with the logic for measuring its duration
        const shlabsPromise = shlabsSpotifyAPICall(spotifyResult.trackId).then(res => ({ res, took: performance.now() - shlabsStart }));

        // Make the spotify Promise
        const spotifyPromise = getSpotifyTrackInfo(spotifyResult.trackId);
        // Make the Sightengine Promise, which depends on the Spotify Promise to get the album art URL
        const sightenginePromise = spotifyPromise.then(info => {
          if (info && info.image) {
            return SightengineAPICall(info.image).then(res => ({ res, image: info.image }));
          }
          return null;
        });

        const shlabsStart = performance.now();

        // Start DB query, SHLabs API Call, Spotify API call, and Sightengine API call in parallel
        const [guildConfig, shlabsWrapped, spotifyInfo, sightengineWrapped] = await Promise.all([
          GuildConfig.findOne({ guildId: interaction.guildId }),
          shlabsPromise,
          spotifyPromise,
          sightenginePromise
        ]);

        // Check if the interaction is in a guild and if the channel is allowed
        if (guildConfig && guildConfig.allowedChannels && guildConfig.allowedChannels.length > 0 && !guildConfig.allowedChannels.includes(interaction.channelId)) {
          // Gets an the array of allowed channels from the database to add to the message to tell the user which channels they can use the command in
          const allowedChannelsMention = guildConfig.allowedChannels.map(id => `<#${id}>`).join(', ');
          return interaction.editReply({ content: `This command is not allowed in this channel. Please use one of the following channels: ${allowedChannelsMention}` });
        }

        // Determine the embed color based on the track's album art
        let embedColor = 0x1DB954; // fallback (Spotify green)
        if (spotifyInfo.image) {
          try {
            const { hex } = await getAverageColor(spotifyInfo.image);
            embedColor = parseInt(hex.replace("#", ""), 16);
          } catch (error) {
            console.warn("Failed to get average color from album art, using fallback color.", error);
          }
        }
        // Extract relevant data from the SH Labs API response
        const {result, usage} = shlabsWrapped.res;
        const {spectral_probabilities, temporal_probabilities} = result;
        const sightengineAIProbabilitypercent = sightengineWrapped?.res?.type?.ai_generated * 100;

        // Log usage information to the console
        console.log(`Daily usage left for SH Labs API: ${usage.daily_remaining} out of 500`);
        console.log(`Monthly usage left for SH Labs API: ${usage.monthly_remaining} out of 10000`);
        
        // Create an embed message to display the results
        const embed = new EmbedBuilder()
        .setTitle(`Prediction: ${result.prediction}`)
        .setURL(songURL)
        .setDescription(`Song: ${spotifyInfo.title} by ${spotifyInfo.artists.join(', ')}`)
        .setColor(embedColor)
        .setFields(
            {name: "Spectral Human", value: `${spectral_probabilities.human}%`, inline: true}, 
            {name: "Spectral Processed AI", value: `${spectral_probabilities.processed_ai}%`, inline: true}, 
            {name: "Spectral Pure AI", value: `${spectral_probabilities.pure_ai}%`, inline: true},
            {name: "Temporal Human", value: `${temporal_probabilities.human}%`, inline: true}, 
            {name: "Temporal Processed AI", value: `${temporal_probabilities.processed_ai}%`, inline: true}, 
            {name: "Temporal Pure AI", value: `${temporal_probabilities.pure_ai}%`, inline: true},
            {name: "Image AI Analysis", value: `${sightengineAIProbabilitypercent}%`, inline: false})
        .setTimestamp();

        if(spotifyInfo.image){
          embed.setThumbnail(spotifyInfo.image);
        }

        const endTime = performance.now();
        const shlabsDurationMs = shlabsWrapped.took;

        const totalResponseTime = ((endTime - startTime) / 1000).toFixed(2); // convert ms to seconds
        const SHLabsAPIResponseTime = (shlabsDurationMs / 1000).toFixed(2); // convert ms to seconds (measured locally)
        const spotifyAPITime = spotifyInfo.durationMs ? (spotifyInfo.durationMs / 1000).toFixed(2) : 'N/A'; // convert ms to seconds
        embed.setFooter({text: `Total Response Time ${totalResponseTime} seconds | SH Labs API Response Time ${SHLabsAPIResponseTime} seconds | Spotify API Response Time ${spotifyAPITime} seconds`});

        // Send the embed as a reply to the interaction
        await interaction.editReply({embeds: [embed] });
      } 
      catch (error) 
      {
        const err = /** @type {any} */ (error);

        const SHError = err?.error;

        console.error("[check-song] error:", error);

        if (SHError) {
          return interaction.editReply(`error (${SHError}): ${err?.details}\nTry again in a moment.`);
        }

        return interaction.editReply("An error occurred while checking the song. Try again in a moment.");
      }
    }
}