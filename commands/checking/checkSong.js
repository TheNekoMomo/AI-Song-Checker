const { SlashCommandBuilder, InteractionContextType, EmbedBuilder, MessageFlags, ChannelType } = require('discord.js');
const { getAverageColor } = require("fast-average-color-node");

const GuildConfig = require('#models/GuildConfig');

const { UploadFile } = require('#utility/CloudflareStorage');
const { DownloadYoutubeAudio, ValidateYoutubeURL, GetYoutubeVideoInfo } = require('#utility/YoutubeHelper');
const { ValidateSpotifyTrackURL, GetSpotifyTrackInfo } = require('#utility/SpotifyHelper');
const SubmitHubAPI = require('#utility/SubmitHubAPI');

module.exports = {
	data: new SlashCommandBuilder().setName('check-song').setDescription('Checks a given song.').setContexts(InteractionContextType.Guild)
    .addSubcommand((subcommand) => subcommand.setName('spotify').setDescription('Checks a Spotify track URL for AI.')
        .addStringOption((option) => option.setName('spotify-url').setDescription('Spotify track URL').setRequired(true)))
    .addSubcommand((subcommand) => subcommand.setName('youtube').setDescription('Checks a Youtube video for AI music.')
        .addStringOption((option) => option.setName('youtube-url').setDescription('Youtube video URL').setRequired(true))),
    cooldown: 5,
	remove: false,
	async execute(interaction) {
        // Check that the command was used in a guilds normal text channel
        if (!interaction.inGuild() || interaction.channel?.type !== ChannelType.GuildText) {
            return interaction.reply({ content: "This command can only be used in a normal text channel within a guild.", flags: MessageFlags.Ephemeral });
        }
        // Defer the reply to give us more time to process the command
        await interaction.deferReply();
        // Check if this guild has allowed channels set and if the command was used in one of them
        const guildConfig = await GuildConfig.findOne({ guildId: interaction.guildId });
        if (guildConfig && guildConfig.allowedChannels && guildConfig.allowedChannels.length > 0 && !guildConfig.allowedChannels.includes(interaction.channelId)) {
            const allowedChannelsMention = guildConfig.allowedChannels.map(id => `<#${id}>`).join(', ');
            return await interaction.editReply({content: `This command is not allowed in this channel. Please use one of the following channels: ${allowedChannelsMention}`});
        }
        // Create the embed that will be sent at the end
        const embed = new EmbedBuilder().setTimestamp();
        // Get the Sub command used
        const subcommand = interaction.options.getSubcommand();
        let shLabsRequest;
        // spotify sub command
        if (subcommand === 'spotify') {
            // Get the url given for spotify 
            const url = interaction.options.getString('spotify-url');
            // Convert and Check that URL in ParseSpotifyTrackURL 
            const spotifyTrackID = ValidateSpotifyTrackURL(url);
            // If null then was not a valid TrackURL return to stop
            if (!spotifyTrackID) return await interaction.editReply({content: `Invalid Spotify track URL.`});
            // Fallback color for spotify embed
            let embedColor = 0x1DB954;
            // Try get The track info from spotify and add it to the embed
            try {
                const spotifyTrack = await GetSpotifyTrackInfo(spotifyTrackID);
                embed.setDescription(`Song: ${spotifyTrack.title} by ${spotifyTrack.artists.join(', ')}`);
                if (spotifyTrack.image) {
                    // Get the average color of the image of the song and use it for the embed color
                    const { hex } = await getAverageColor(spotifyTrack.image);
                    embedColor = parseInt(hex.replace('#', ''), 16);
                    embed.setThumbnail(spotifyTrack.image);
                }
            } catch (error) {
                console.log(error);
            }
            // Set the embed URL and color to that used for Spotify
            embed.setURL(url).setColor(embedColor);

            shLabsRequest = { spotifyTrackId: spotifyTrackID };
        }
        // youtube sub command
        else if (subcommand === 'youtube') {
            // Get the url given for youtube 
            const url = interaction.options.getString('youtube-url');
            const validVideo = await ValidateYoutubeURL(url);
            if (!validVideo.ok) return await interaction.editReply({content: validVideo.reason});
            // Download the youtube video as a mp3 file
            await interaction.editReply({content: `Downloading: ${url}`});
            const file = await DownloadYoutubeAudio(url);
            // Upload the Local file to Cloudflare to get a URL
            await interaction.editReply({content: `Video has been downloaded, now uploading.`});
            const songURL = await UploadFile(file);

            const videoInfo = await GetYoutubeVideoInfo(url);
            if (videoInfo) {
                embed.setDescription(videoInfo.title).setThumbnail(videoInfo.thumbnail);
            }

            // Set the embed URL and color to that used for Youtube
            embed.setURL(url).setColor(0xFF0000);

            shLabsRequest = { audioUrl: songURL };
        }
        // Request SubmitHub to check the given song
        await interaction.editReply({content: `Waiting on submithub.com`});
        const response = await SubmitHubAPI(shLabsRequest);
        // Check that status in case of errors
        if (response.status === 500) {
            return await interaction.editReply({content: `Error: ${response.status || 'Unknown'} AI detection service temporarily unavailable.`});
        }
        if (response.status !== 200 || !response) {
            if (response) console.log(response);
            return await interaction.editReply({content: `Error: ${response.status || 'Unknown'}. Sorry, There was a problem.\nTry again later.`});
        }
        const {result, usage} = response.data;
        // Log the usage for submithub
        console.log(`Daily usage left for SH Labs API: ${usage.daily_remaining} out of 500`);
        console.log(`Monthly usage left for SH Labs API: ${usage.monthly_remaining} out of 10000`);

        const {spectral_probabilities, temporal_probabilities} = result;
        embed.setTitle(`Prediction: ${result.prediction}`)
        .setFields(
            {name: "Spectral Human", value: `${spectral_probabilities.human}%`, inline: true}, 
            {name: "Spectral Processed AI", value: `${spectral_probabilities.processed_ai}%`, inline: true}, 
            {name: "Spectral Pure AI", value: `${spectral_probabilities.pure_ai}%`, inline: true},
            {name: "Temporal Human", value: `${temporal_probabilities.human}%`, inline: true}, 
            {name: "Temporal Processed AI", value: `${temporal_probabilities.processed_ai}%`, inline: true}, 
            {name: "Temporal Pure AI", value: `${temporal_probabilities.pure_ai}%`, inline: true}
        );

        await interaction.editReply({ content: '', embeds: [embed] });
	},
};