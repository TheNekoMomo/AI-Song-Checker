const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

let cachedToken = null;
let tokenExpiresAt = 0;
const tokenBufferTime = 10_000;

async function GetSpotifyAccessToken() {
    const now = Date.now();
    if (cachedToken && now < tokenExpiresAt - tokenBufferTime) return cachedToken;

    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${basic}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Spotify token error: ${response.status} ${text}`);
    }

    const data = await response.json();
    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in * 1000);

    return cachedToken;
}

function ValidateSpotifyTrackURL(trackURL) {
    try {
        const url = new URL(trackURL);
        if (url.hostname !== 'open.spotify.com') return null;
        const match = url.pathname.match(/\/track\/([A-Za-z0-9]{22})/);
        if (!match) return null;
        return match[1];
    } catch (error) {
        return null;
    }
}

async function GetSpotifyTrackInfo(trackId) {
    const token = await GetSpotifyAccessToken();
    const response = await fetch(
        `https://api.spotify.com/v1/tracks/${trackId}`, 
        {headers: 
            { Authorization: `Bearer ${token}` 
        }
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Spotify track error: ${response.status} ${text}`);
    }
    const track = await response.json();
    return {
        title: track.name,
        artists: track.artists.map((artist) => artist.name),
        image: track.album?.images?.[0]?.url || null,
        album: track.album?.name || null
    };
}

module.exports = { ValidateSpotifyTrackURL, GetSpotifyTrackInfo }