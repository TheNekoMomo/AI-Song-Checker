require('dotenv').config();

/** @typedef {import('../../types').SpotifyTrackParseResult} SpotifyTrackParseResult */
/** @typedef {import('../../types').SpotifyTrackInfo} SpotifyTrackInfo */
/** @typedef {import('../../types').SpotifyTrackResponse} SpotifyTrackResponse */

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


let cachedToken = null;
let tokenExpiresAt = 0;
const tokenBufferTime = 10_000; // 10 seconds buffer to account for network delays and processing time

/**
 * Gets an app access token from Spotify using Client Credentials flow.
 * @returns {Promise<string>}
 */
async function getSpotifyAccessToken() {

  // If we have a cached token that hasn't expired, return it
  const now = Date.now();
  if(cachedToken && now < tokenExpiresAt - tokenBufferTime){
    return cachedToken;
  }

  // Spotify Client ID and Secret retrieved from environment variables
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
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

  // Parse the JSON response to extract the access token and its expiration time, then cache it for future use
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in * 1000);

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

module.exports = {
  parseSpotifyTrackURL,
  getSpotifyTrackInfo
};