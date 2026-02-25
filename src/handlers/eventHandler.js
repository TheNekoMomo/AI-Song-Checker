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

        eventFiles.sort((a, b) => a.localeCompare(b));

        const eventName = eventFolder.replace(/\\/g, '/').split('/').pop();
        if (!eventName) continue;

        const handlers = eventFiles.map(file => {
            /** @type {EventFileHandler} */
            const handler = require(file);
            return handler;
        });

        client.on(eventName, async (...args) => {
            for (let handler of handlers)
            {
                await handler(client, ...args);
            }
        });
    }
};

module.exports = EventHandler;