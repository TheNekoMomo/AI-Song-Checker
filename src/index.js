const { Client, IntentsBitField } = require('discord.js');
require('dotenv').config();

const { connectDB } = require("./db");
const eventHandler = require('./handlers/eventHandler');
const getLocalIPs = require('./utils/GetLocalIP');

const client = new Client({intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages
    ]
});

eventHandler(client);

(async () => {
    try {
        console.log('Local IPs:', getLocalIPs());
        await connectDB(process.env.MONGODB_URI);
        await client.login(process.env.TOKEN);
    }
    catch (error) {
        console.error('Startup failed:', error);
        process.exit(1);
    }
})();