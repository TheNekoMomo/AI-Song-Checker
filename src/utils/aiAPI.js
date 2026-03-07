require('dotenv').config();
const axios = require('axios');

/**
 * @param {string} trackId
 */
async function  shlabsSpotifyAPICall(trackId){
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

/**
 * @param {string} imageURL
 */
async function SightengineAPICall(imageURL){
    const result = await axios.get('https://api.sightengine.com/1.0/check.json',{
        params: {
            url: imageURL,
            models: 'genai',
            api_user: process.env.SIGHTENGINE_USER,
            api_secret: process.env.SIGHTENGINE_SECRET
        }
    }).catch(function (error) {
        if(error.response) {
            console.error('Sightengine API Error:', error.response.data);
        } else {
            console.error('Sightengine API Request Error:', error.message);
        }
    });

    return result?.data;
}

module.exports = {
    shlabsSpotifyAPICall,
    SightengineAPICall
}