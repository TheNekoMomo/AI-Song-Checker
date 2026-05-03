const { Collection } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
// local marker to know if deploying commands locally or globally, since global commands can take up to an hour to update
const LOCAL_MARKER = '.local_marker';

function LoadCommandsToClient(client) {
    // Create a new collection for commands and set it to the client so it can be accessed in other files
    client.commands = new Collection();
    // Define the path to the commands folder and read all the command folders
    const foldersPath = path.join(__dirname, '..', 'commands');
    const commandFolders = fs.readdirSync(foldersPath);
    // Loop through each command folder and read all the command files
    for (const folder of commandFolders) {
        // Define the path to the command files and read all the .js files
        const commandsPath = path.join(foldersPath, folder);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        // Loop through each command file in the folder and set the command in the client's command collection
        for (const file of commandFiles) {
            // Define the path to the command file and require it
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            // Set a new item in the Command Collection with the key as the command name and the value as the exported module
            if ('data' in command && 'execute' in command) {
                // make sure command.remove exist
                command.remove = command.remove ?? false;

                console.log(`✅ Loaded command: ${command.data.name}`);
                client.commands.set(command.data.name, command);
            } else {
                console.log(`⚠️ [WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
            }
        }
    }
}

async function getApplicationCommands(client, guildId) {
	let applicationCommands = null;

	if (guildId) {
		console.log(`Fetching application commands for guild ID: ${guildId}`);
		const guild = await client.guilds.fetch(guildId);
		applicationCommands = guild?.commands;
	}
	else {
		console.log(`Fetching global application commands`);
		applicationCommands = client.application?.commands;
	}

	await applicationCommands?.fetch();
	return applicationCommands;
}

function normalizeOption(opt) {
	const normalized = {
		type: opt.type,
		name: opt.name,
		description: opt.description,
		required: opt.required ?? false,
	};

	// Recursively normalize nested options (for sub-commands and sub-command groups)
	if (opt.options && opt.options.length > 0) {
		normalized.options = opt.options.map(nestedOpt => normalizeOption(nestedOpt));
	}

	// Include min/max values if they exist (for number/integer types)
	if (opt.min_value !== undefined) normalized.min_value = opt.min_value;
	if (opt.max_value !== undefined) normalized.max_value = opt.max_value;

	// Include min/max length if they exist (for string types)
	if (opt.min_length !== undefined) normalized.min_length = opt.min_length;
	if (opt.max_length !== undefined) normalized.max_length = opt.max_length;

	// Include choices if they exist
	if (opt.choices && opt.choices.length > 0) {
		normalized.choices = opt.choices.map(choice => ({
			name: choice.name,
			value: choice.value,
		}));
	}

	return normalized;
}

function normalizeCommand(command) {
	// Normalize permissions - convert BigInt to string for comparison
	let permissions = command.defaultMemberPermissions ?? command.default_member_permissions;
	
	// Convert BigInt to string so it can be JSON serialized
	if (typeof permissions === 'bigint') {
		permissions = permissions.toString();
	}
	
	return {
        name: command.name,
        description: command.description,
        options: command.options?.map(opt => normalizeOption(opt)) ?? [],
        dm_permission: command.dm_permission ?? true,
        nsfw: command.nsfw ?? false,
		default_member_permissions: permissions,
	};
}
function isLocal() {
	const markerPath = path.resolve(process.cwd(), LOCAL_MARKER);
	try {
		return fs.existsSync(markerPath);
	} catch (err) {
		// if something goes wrong reading the fs, assume not local
		return false;
	}
}

async function DeployCommands(client) {
	const guildID = isLocal() ? process.env.GUILD_ID : undefined;
	const applicationCommands = await getApplicationCommands(client, guildID);

	LoadCommandsToClient(client);

	for (const [commandName, command] of client.commands) {
		const applicationCommand = applicationCommands?.cache.find(cmd => cmd.name === commandName);
		// If the command exists, check if it needs to be updated, or deleted
		if(applicationCommand) {

			const normalizedCommand = normalizeCommand(command.data.toJSON());
			const normalizedApplicationCommand = normalizeCommand(applicationCommand.toJSON());

			// check if the command is mark for deletion
			if (command.remove) {
				console.log(`🗑️ Deleting command: ${commandName}`);
				await applicationCommands?.delete(applicationCommand.id);
				continue;
			}
			else if (JSON.stringify(normalizedCommand) !== JSON.stringify(normalizedApplicationCommand)) {
				console.log(`🔄 Updating command: ${commandName}`);
				await applicationCommands?.edit(applicationCommand.id, command.data.toJSON());
				continue;
			}
			else {
				console.log(`✅ Command is up to date: ${commandName}`);
				continue;
			}
		}
		else {
			if (!command.remove) {
				console.log(`➕ Creating command: ${commandName}`);
				await applicationCommands?.create(command.data.toJSON());
				continue;
			}

			console.log(`❌ Command marked for deletion does not exist, skipping: ${commandName}`);
		}
	}
}

module.exports = { DeployCommands };