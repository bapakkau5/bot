// config.js
function req(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

module.exports = {
  DISCORD_TOKEN: req("DISCORD_TOKEN"),
  GUILD_ID: req("GUILD_ID"),
  LIVE_CHANNEL_ID: req("LIVE_CHANNEL_ID"),
  ANNOUNCE_CHANNEL_ID: req("ANNOUNCE_CHANNEL_ID"),
  UNIVERSE_ID: req("UNIVERSE_ID"),

  // Ubah ini kalau mau
  PREFIX: ";",
  SITE_LINK: "https://gunungroblox.my.id",

  // Interval update live card (ms). Default 60 detik.
  LIVE_UPDATE_INTERVAL: Number(process.env.LIVE_UPDATE_INTERVAL || 60000),

  // Pesan DM welcome
  WELCOME_DM: (username, link) =>
    `Halo **${username}**! 👋\nSelamat datang di **Mount Veridia** ⛰️\nCek website: ${link}\n\nHave fun!`
};
