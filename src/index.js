const { Client, IntentsBitField } = require('discord.js');
require('dotenv').config();

const { connectDB } = require("./db");
const eventHandler = require('./handlers/eventHandler');
const getPublicIP = require('./utils/GetIP');

const {DownloadYoutubeAudio} = require('./utils/YoutubeHelper');

const client = new Client({intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages
    ]
});

eventHandler(client);

(async () => {
    try {
        console.log('Public IP:', await getPublicIP());
        await connectDB(process.env.MONGODB_URI);
        await client.login(process.env.TOKEN);
    }
    catch (error) {
        console.error('Startup failed:', error);
        process.exit(1);
    }
})();