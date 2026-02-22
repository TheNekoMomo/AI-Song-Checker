// @ts-check

/**
 * Fetches the application command manager (global or guild) and ensures it is populated.
 * @param {import('discord.js').Client} client - The Discord client.
 * @param {string} [guildId] - Optional guild ID to target guild-specific commands.
 * @returns {Promise<import('discord.js').ApplicationCommandManager | import('discord.js').GuildApplicationCommandManager | null>}
 */
async function getApplicationCommands(client, guildId) 
{
  /** @type {import('discord.js').ApplicationCommandManager | import('discord.js').GuildApplicationCommandManager | undefined} */
  let applicationCommands;

  if (guildId) 
  {
    const guild = await client.guilds.fetch(guildId);
    applicationCommands = guild.commands;
  } 
  else
  {
    applicationCommands = client.application?.commands;
  }

  if(applicationCommands == null) return null;

  await applicationCommands.fetch({});
  return applicationCommands;
}

module.exports = getApplicationCommands;