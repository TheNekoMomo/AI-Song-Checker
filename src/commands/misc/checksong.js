// @ts-check
/** @typedef {import('../../types').Command} Command */

const { ApplicationCommandOptionType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
require('dotenv').config();

/** @type {Command} */
module.exports = {
    name: 'check-song',
    description: 'checks a song against shlabs.music',
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
        await interaction.deferReply();

        const songURL = interaction.options.getString('spotify-url', true);

        const spotifyResult = parseSpotifyTrackURL(songURL);

        if(!spotifyResult.valid)
        {
            return interaction.editReply("Invalid Spotify track URL.");
        }

        const trackId = spotifyResult.trackId || "";
        const shlabsResult = await shlabsAPICall(trackId);

        const {result,response_time, usage} = shlabsResult;

        const {human, processed_ai, pure_ai} = result.spectral_probabilities;

        console.log(shlabsResult);

        const embed = new EmbedBuilder()
        .setTitle(`Prediction: ${result.prediction}`)
        .setDescription(`Track ID: ${spotifyResult.trackId}`)
        .setColor('Random')
        .setFields(
            {name: "Human", value: human.toFixed(2), inline: true}, 
            {name: "Processed AI", value: processed_ai.toFixed(2), inline: true}, 
            {name: "Pure AI", value: pure_ai.toFixed(2), inline: true})
        .setFooter({text: `Response Time ${response_time}ms`})
        .setTimestamp();

        await interaction.editReply({embeds: [embed] });
    }
}

/**
 * @param {string} input
 */
function parseSpotifyTrackURL(input) {
  try {
    const url = new URL(input);

    if (url.hostname !== "open.spotify.com")
    {
      return { valid: false, trackId: null };
    }

    const match = url.pathname.match(/^\/track\/([A-Za-z0-9]{22})/);

    if (!match)
    {
      return { valid: false, trackId: null };
    }

    return {
      valid: true,
      trackId: match[1]
    };

  } catch {
    return { valid: false, trackId: null };
  }
}

/**
 * @param {string} trackId
 */
async function  shlabsAPICall(trackId){
    const result = await axios.post(
        'https://shlabs.music/api/v1/detect',
        {spotifyTrackId: trackId },
        {
            headers: {
                'X-API-Key': process.env.SH_LABS_APIKEY,
                'Content-Type': 'application/json'
            }
        }
    )

    return result.data;
}