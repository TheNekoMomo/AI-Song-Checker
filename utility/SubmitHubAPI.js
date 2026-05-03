const axios = require('axios');

const shLabsAPIKey = process.env.SH_LABS_APIKEY;

async function SubmitHubAPI(requestBody) {
    try {
        const result = await axios.post(
            'https://shlabs.music/api/v1/detect',
            requestBody,
            {
                headers: {
                'X-API-Key': shLabsAPIKey,
                'Content-Type': 'application/json'
                }
            }
        );
        return result;
    } catch (error) {
        console.log(error);
        return null;
    }
}

module.exports = SubmitHubAPI;