require('dotenv').config();
const { connectDB } = require("./db");
const { Client, IntentsBitField } = require('discord.js');
const eventHandler = require('./handlers/eventHandler');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
});

eventHandler(client);

(async () => {
    try {
        await connectDB(process.env.MONGODB_URI);
        await client.login(process.env.TOKEN);
    }
    catch (error) {
        console.error('Startup failed:', error);
        process.exit(1);
    }
})();