// @ts-check

const path = require('path');
const getAllFiles = require('../utils/getAllFiles');

/** @typedef {import('../types').EventFileHandler} EventFileHandler */

/**
 * Register all event handlers from src/events/<eventName>/*.js
 * @function EventHandler
 * @param {import('discord.js').Client} client
 */
function EventHandler (client)
{
    const eventFolders = getAllFiles(path.join(__dirname, '..', 'events'), true);

    for (let eventFolder of eventFolders)
    {
        const eventFiles = getAllFiles(eventFolder);

        eventFiles.sort((a, b) => Number(a > b));

        const eventName = eventFolder.replace(/\\/g, '/').split('/').pop();
        if (!eventName) continue;
        client.on(eventName, async (arg) => {
            for (let eventFile of eventFiles)
            {
                /** @type {EventFileHandler} */
                const eventFunction = require(eventFile);
                await eventFunction(client, arg);
            }
        });
    }
};

module.exports = EventHandler;