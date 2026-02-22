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

export {};
