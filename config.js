// config.js
function must(name) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    throw new Error(`Missing env: ${name}`);
  }
  return String(v).trim();
}

function opt(name, fallback = "") {
  const v = process.env[name];
  return v ? String(v).trim() : fallback;
}

const OWNER_IDS = opt("OWNER_IDS", "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

module.exports = {
  DISCORD_TOKEN: must("DISCORD_TOKEN"),

  // Server & channel
  GUILD_ID: must("GUILD_ID"),
  LIVE_CHANNEL_ID: must("LIVE_CHANNEL_ID"),
  ANNOUNCE_CHANNEL_ID: opt("ANNOUNCE_CHANNEL_ID", ""),

  // Roblox
  UNIVERSE_ID: must("UNIVERSE_ID"),

  // Bot behavior
  PREFIX: ";",
  UPDATE_INTERVAL_MS: Number(opt("UPDATE_INTERVAL_MS", "60000")), // default 60 detik

  // Owner-only
  OWNER_IDS
};
