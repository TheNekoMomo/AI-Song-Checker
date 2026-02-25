const mongoose = require("mongoose");

const guildConfigSchema = new mongoose.Schema(
  {
    // Discord guild ID used as the unique identifier for each guild's config
    guildId: { type: String, required: true, unique: true, index: true },

    // Channel ID inside THIS guild where commands will be allowed. If null, commands are allowed in all channels.
    allowedChannels: { type: [String], default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GuildConfig", guildConfigSchema);