require('dotenv').config();
const axios = require('axios');

/**
 * @param {number} milliseconds
 */
function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * @param {string} trackId
 * @returns {Promise<any>}
 */
async function shlabsSpotifyAPICall(trackId) {
  const requestBody = { spotifyTrackId: trackId };
  const requestConfig = {
    timeout: 60000,
    headers: {
      'X-API-Key': process.env.SH_LABS_APIKEY,
      'Content-Type': 'application/json',
    },
  };

  let lastError;

  for (let attemptNumber = 1; attemptNumber <= 2; attemptNumber++) {
    try {
      const response = await axios.post(
        'https://shlabs.music/api/v1/detect',
        requestBody,
        requestConfig
      );

      return response.data;
    } catch (error) {
      const axiosError = /** @type {any} */ (error);
      const statusCode = axiosError?.response?.status;

      lastError = error;

      const shouldRetry =
        attemptNumber < 2 &&
        (statusCode === 502 || statusCode === 503 || statusCode === 504);

      if (!shouldRetry) {
        throw error;
      }

      await sleep(1500);
    }
  }

  throw lastError;
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