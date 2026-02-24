// @ts-check
/** @typedef {import('../../types').Command} Command */
/** @typedef {import('../../types').SpotifyTrackParseResult} SpotifyTrackParseResult */
/** @typedef {import('../../types').SpotifyTrackInfo} SpotifyTrackInfo */
/** @typedef {import('../../types').SpotifyTrackResponse} SpotifyTrackResponse */

const { ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
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
        // Call the SH Labs API and get Spotify track info in parallel
        const shlabsResult = await shlabsAPICall(trackId);
        const spotifyInfo = await getSpotifyTrackInfo(trackId);
        // Determine the embed color based on the track's album art
        let embedColor = 0x1DB954; // fallback (Spotify green)
        if (spotifyInfo.image) {
          const { hex } = await getAverageColor(spotifyInfo.image);
          embedColor = parseInt(hex.replace("#", ""), 16);
        }
        // Extract relevant data from the SH Labs API response
        const {result,response_time, usage} = shlabsResult;
        const {human, processed_ai, pure_ai} = result.spectral_probabilities;
        // Log usage information to the console
        console.log(`Daily usage left for SH Labs API: ${usage.daily_remaining} out of 500`);
        console.log(`Monthly usage left for SH Labs API: ${usage.monthly_remaining} out of 10000`);
        // Create an embed message to display the results
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
        // Send the embed as a reply to the interaction
        await interaction.editReply({embeds: [embed] });
    }
}

/**
 * @param {string} input
 * @returns {SpotifyTrackParseResult}
 */
function parseSpotifyTrackURL(input) {
  try {
    // This will throw if the input is not a valid URL
    const url = new URL(input);
    // Check if the hostname is correct for Spotify track URLs
    if (url.hostname !== "open.spotify.com") {
      return { valid: false, trackId: null };
    }
    // Use a regex to extract the track ID from the pathname
    const match = url.pathname.match(/^\/track\/([A-Za-z0-9]{22})/);
    // If the regex doesn't match, it's not a valid Spotify track URL
    if (!match) {
      return { valid: false, trackId: null };
    }
    // If we got here, we have a valid track ID
    return { valid: true, trackId: match[1] };
  } catch {
    // If any error occurs (invalid URL, etc.), return invalid
    return { valid: false, trackId: null };
  }
}

/**
 * @param {string} trackId
 */
async function  shlabsAPICall(trackId){
  // Make a POST request to the SH Labs API with the Spotify track ID
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
    // Return the data from the API response
    return result.data;
}

/**
 * Gets an app access token from Spotify using Client Credentials flow.
 * @returns {Promise<string>}
 */
async function getSpotifyAccessToken() {
  // Spotify Client ID and Secret retrieved from environment variables
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  // Encode the client ID and secret in Base64 for the Authorization header
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  // Make a POST request to Spotify's token endpoint to get an access token
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  // If the response is not OK, throw an error with the status and response text
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify token error: ${res.status} ${text}`);
  }
  // Parse the JSON response to extract the access token
  const data = await res.json();
  return data.access_token;
}

/**
 * @param {string} trackId
 * @returns {Promise<SpotifyTrackInfo>}
 */
async function getSpotifyTrackInfo(trackId) {
  // Get an access token from Spotify to authenticate the API request
  const token = await getSpotifyAccessToken();
  // Make a GET request to Spotify's API to retrieve track information using the track ID
  const res = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  // If the response is not OK, throw an error with the status and response text
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Spotify track error: ${res.status} ${text}`);
  }
  // Parse the JSON response to extract relevant track information
  /** @type {SpotifyTrackResponse} */
  const t = await res.json();
  // Return an object containing the track's ID, title, artists, Spotify URL, album art image URL, and album name
  return {
    id: t.id,
    title: t.name,
    artists: t.artists.map((a) => a.name),
    url: t.external_urls?.spotify || null,
    image: t.album?.images?.[0]?.url || null,
    album: t.album?.name || null,
  };
}