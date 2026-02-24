// @ts-check

/**
 * @typedef {Object} CommandOption
 * @property {string} name
 * @property {string} description
 * @property {boolean} [required]
 * @property {import('discord.js').ApplicationCommandOptionType} type
 * @property {{ name: string, value: any }[]} [choices]
 */

/**
 * @typedef {Object} Command
 * @property {string} name
 * @property {string} description
 * @property {boolean} [devOnly]
 * @property {boolean} [testOnly]
 * @property {CommandOption[]} [options]
 * @property {import('discord.js').PermissionResolvable[]} [permissionsRequired]
 * @property {import('discord.js').PermissionResolvable[]} [botPermissions]
 * @property {boolean} [deleted]
 * @property {(client: import('discord.js').Client, interaction: import('discord.js').ChatInputCommandInteraction) => any} callback
 */

/**
 * Function each event file exports.
 * @typedef {(client: import('discord.js').Client, ...args: any[]) => void} EventFileHandlerSync
 * @typedef {(client: import('discord.js').Client, ...args: any[]) => Promise<void>} EventFileHandlerAsync
 * @typedef {EventFileHandlerSync | EventFileHandlerAsync} EventFileHandler
 * 
 */

/**
 * Spotify parsing result for open.spotify.com track links.
 * @typedef {{ valid: true, trackId: string } | { valid: false, trackId: null }} SpotifyTrackParseResult
 */

/**
 * Normalized Spotify track info used by the bot.
 * @typedef {Object} SpotifyTrackInfo
 * @property {string} id
 * @property {string} title
 * @property {string[]} artists
 * @property {string|null} url
 * @property {string|null} image
 * @property {string|null} album
 */

/**
 * Minimal Spotify API track response shape (only what we use).
 * @typedef {Object} SpotifyTrackResponse
 * @property {string} id
 * @property {string} name
 * @property {{ name: string }[]} artists
 * @property {{ name: string, images: { url: string }[] }} album
 * @property {{ spotify?: string }} [external_urls]
 */

export {};
