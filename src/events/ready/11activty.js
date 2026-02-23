// @ts-check
const {ActivityType } = require('discord.js');

/** @typedef {import('../../types').EventFileHandler} EventFileHandler */

/** @type {EventFileHandler} */
module.exports = (client) => {
    client.user?.setActivity({
        name: 'Looking for Clankers',
        type: ActivityType.Streaming,
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley',
    });
};