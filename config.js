require("dotenv").config();

function must(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

module.exports = {
  DISCORD_TOKEN: must("DISCORD_TOKEN"),
  CLIENT_ID: must("CLIENT_ID"),
  GUILD_ID: must("GUILD_ID"),
  UNIVERSE_ID: must("UNIVERSE_ID"),
  LIVE_CHANNEL_ID: must("LIVE_CHANNEL_ID"),
  ANNOUNCE_CHANNEL_ID: must("ANNOUNCE_CHANNEL_ID"),

  WEBSITE_URL: process.env.WEBSITE_URL || "https://gunungroblox.my.id/",
  ROBLOX_URL: process.env.ROBLOX_URL || "https://www.roblox.com/",
  DISCORD_INVITE: process.env.DISCORD_INVITE || ""
};
