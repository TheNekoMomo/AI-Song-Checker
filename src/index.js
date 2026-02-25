// @ts-check

require('dotenv').config();
//const { connectDB } = require("./db");
const { Client, IntentsBitField } = require('discord.js');
const eventHandler = require('./handlers/eventHandler');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
});

//@ts-expect-error
eventHandler(client);

(async () => {

    try {
        const res = await fetch("https://api.ipify.org?format=json");
        const data = await res.json();
        console.log("[network] outbound IPv4:", data.ip);
  } catch (e) {
        console.log("[network] could not fetch outbound IP:", e?.message || e);
  }

    try {
        //await connectDB(process.env.MONGODB_URI);
        await client.login(process.env.TOKEN);
    }
    catch (error) {
        console.error('Startup failed:', error);
        process.exit(1);
    }
})();