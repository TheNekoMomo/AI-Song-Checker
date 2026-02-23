// @ts-check
/** @typedef {import('../../types').Command} Command */

const { ApplicationCommandOptionType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getAverageColor } = require("fast-average-color-node");
const axios = require('axios');
require('dotenv').config();

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
        await interaction.deferReply();

        const songURL = interaction.options.getString('spotify-url', true);

        const spotifyResult = parseSpotifyTrackURL(songURL);

        if(!spotifyResult.valid)
        {
            return interaction.editReply("Invalid Spotify track URL.");
        }

        const trackId = spotifyResult.trackId || "";
        const shlabsResult = await shlabsAPICall(trackId);

        const spotifyInfo = await getSpotifyTrackInfo(trackId);

        const { hex } = await getAverageColor(/** @type {string} */(spotifyInfo.image));
        const embedColor = parseInt(hex.replace("#", ""), 16);

        const {result,response_time, usage} = shlabsResult;
        const {human, processed_ai, pure_ai} = result.spectral_probabilities;

        const embed = new EmbedBuilder()
        .setTitle(`Prediction: ${result.prediction}`)
        .setURL(spotifyInfo.url)
        .setDescription(`Song: ${spotifyInfo.title} by ${spotifyInfo.artists.join(', ')}`)
        .setThumbnail(spotifyInfo.image)
        .setColor(embedColor)
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

/**
 * Gets an app access token from Spotify using Client Credentials flow.
 * @returns {Promise<string>}
 */
async function getSpotifyAccessToken() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify token error: ${res.status} ${text}`);
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * @typedef {Object} SpotifyTrackResponse
 * @property {string} id
 * @property {string} name
 * @property {{ name: string }[]} artists
 * @property {{
 *   name: string,
 *   images: { url: string }[]
 * }} album
 * @property {{ spotify?: string }} [external_urls]
 */
/**
 * @param {string} trackId
 * @returns {Promise<{
 *   id: string,
 *   title: string,
 *   artists: string[],
 *   url: string|null,
 *   image: string|null,
 *   album: string|null
 * }>}
 */
async function getSpotifyTrackInfo(trackId) {
  const token = await getSpotifyAccessToken();

  const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify track error: ${res.status} ${text}`);
  }
/** @type {SpotifyTrackResponse} */
  const t = await res.json();

  return {
    id: t.id,
    title: t.name,
    artists: t.artists.map(a => a.name),
    url: t.external_urls?.spotify || null,
    image: t.album?.images?.[0]?.url || null,
    album: t.album?.name || null,
  };
}