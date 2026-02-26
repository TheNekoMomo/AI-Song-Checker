// @ts-check
/** @typedef {import('../../types').Command} Command */

const { ApplicationCommandOptionType, EmbedBuilder, MessageFlags } = require('discord.js');
const { getAverageColor } = require("fast-average-color-node");
const axios = require('axios');
require('dotenv').config();
const { parseSpotifyTrackURL, getSpotifyTrackInfo } = require('../../utils/spotifyHelper');
const GuildConfig = require("../../models/GuildConfig");
const { performance } = require('perf_hooks');

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
      // Record the start time for performance measurement
      const startTime = performance.now();

      // Check if the interaction is in a guild and if the channel is allowed
      if (interaction.inGuild()) {
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guildId });
        if (guildConfig && guildConfig.allowedChannels && guildConfig.allowedChannels.length > 0 && !guildConfig.allowedChannels.includes(interaction.channelId)) {
          // Gets an the array of allowed channels from the database to add to the message to tell the user which channels they can use the command in
          const allowedChannelsMention = guildConfig.allowedChannels.map(id => `<#${id}>`).join(', ');
          return interaction.reply({ content: `This command is not allowed in this channel. Please use one of the following channels: ${allowedChannelsMention}`, flags: MessageFlags.Ephemeral });
        }
      }

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

      // trackId is now definitely a string
      const trackId = spotifyResult.trackId;
      try 
      {
        // Call the SH Labs API and get Spotify track info in parallel
        const [shlabsResult, spotifyInfo] = await Promise.all([
          shlabsAPICall(trackId),
          getSpotifyTrackInfo(trackId)
        ]);

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
        const {result, response_time, usage} = shlabsResult;
        const {human, processed_ai, pure_ai} = result.spectral_probabilities;

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
            {name: "Human", value: `${human}%`, inline: true}, 
            {name: "Processed AI", value: `${processed_ai}%`, inline: true}, 
            {name: "Pure AI", value: `${pure_ai}%`, inline: true})
        .setTimestamp();

        if(spotifyInfo.image){
          embed.setThumbnail(spotifyInfo.image);
        }

        const endTime = performance.now();
        const totalResponseTime = ((endTime - startTime) / 1000).toFixed(2); // convert ms to seconds
        const SHLabsAPIResponseTime = (response_time / 1000).toFixed(2); // convert ms to seconds
        const spotifyAPITime = spotifyInfo.durationMs ? (spotifyInfo.durationMs / 1000).toFixed(2) : 'N/A'; // convert ms to seconds
        embed.setFooter({text: `Total Response Time ${totalResponseTime} seconds | SH Labs API Response Time ${SHLabsAPIResponseTime} seconds | Spotify API Response Time ${spotifyAPITime} seconds`});

        // Send the embed as a reply to the interaction
        await interaction.editReply({embeds: [embed] });
      } 
      catch (error) 
      {
        const err = /** @type {any} */ (error);

        const status = err?.response?.status;
        const apiMessage = err?.response?.data?.error || err?.response?.data?.message;

        console.error("[check-song] error:", err?.response?.data ?? err);

        if (status && apiMessage) {
          return interaction.editReply(`error (${status}): ${apiMessage}\nTry again in a moment.`);
        }

        if (status) {
          return interaction.editReply(`error (${status}). Try again in a moment.`);
        }

        return interaction.editReply("An error occurred while checking the song. Try again in a moment.");
      }
    }
}

/**
 * @param {string} trackId
 */
async function  shlabsAPICall(trackId){
  // Make a POST request to the SH Labs API with the Spotify track ID
    const result = await axios.post(
        'https://shlabs.music/api/v1/detect',
        { spotifyTrackId: trackId },
        {
            headers: {
                'X-API-Key': process.env.SH_LABS_APIKEY,
                'Content-Type': 'application/json'
            }
        }
    )
    // Return the data from the API response
    return result.data;
}