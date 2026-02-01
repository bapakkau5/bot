const { EmbedBuilder } = require("discord.js");
const { getUniverseStats } = require("./roblox");
const cfg = require("./config");

function fmt(n) {
  if (typeof n !== "number") return "0";
  return n.toLocaleString("en-US");
}

function buildEmbed(stats) {
  return new EmbedBuilder()
    .setTitle("Live Status")
    .setDescription(`**${stats.name}**`)
    .addFields(
      { name: "Online sekarang", value: `${fmt(stats.playing)}`, inline: true },
      { name: "Favorites", value: `${fmt(stats.favorites)}`, inline: true },
      { name: "Visits", value: `${fmt(stats.visits)}`, inline: true }
    )
    .setFooter({ text: `Auto update tiap ${Math.round(cfg.LIVE_UPDATE_INTERVAL / 1000)} detik` })
    .setTimestamp(new Date());
}

async function getOrCreateLiveMessage(channel) {
  // Cari message terakhir bot yang embednya title "Live Status"
  const msgs = await channel.messages.fetch({ limit: 20 });
  const mine = msgs.find(
    (m) => m.author?.id === channel.client.user.id && m.embeds?.[0]?.title === "Live Status"
  );

  if (mine) return mine;

  const sent = await channel.send({ embeds: [buildEmbed({ name: "Loading...", playing: 0, favorites: 0, visits: 0 })] });
  return sent;
}

async function startLiveLoop(client) {
  const guild = await client.guilds.fetch(cfg.GUILD_ID).catch(() => null);
  if (!guild) throw new Error("Bot tidak ada di guild itu. Cek GUILD_ID.");

  const liveCh = await client.channels.fetch(cfg.LIVE_CHANNEL_ID).catch(() => null);
  const annCh = await client.channels.fetch(cfg.ANNOUNCE_CHANNEL_ID).catch(() => null);

  if (!liveCh?.isTextBased?.()) throw new Error("LIVE_CHANNEL_ID bukan text channel / ga kebaca.");
  if (!annCh?.isTextBased?.()) throw new Error("ANNOUNCE_CHANNEL_ID bukan text channel / ga kebaca.");

  let lastWasOnline = null; // unknown at start
  let liveMsg = await getOrCreateLiveMessage(liveCh);

  const tick = async () => {
    try {
      const stats = await getUniverseStats(cfg.UNIVERSE_ID);

      // Update live embed (edit 1 message)
      const embed = buildEmbed(stats);
      liveMsg = await liveMsg.edit({ embeds: [embed] }).catch(async () => {
        // kalau message hilang/ga bisa edit, buat baru
        liveMsg = await liveCh.send({ embeds: [embed] });
        return liveMsg;
      });

      const isOnline = (stats.playing ?? 0) > 0;

      // Announce saat perubahan state
      if (lastWasOnline === null) {
        lastWasOnline = isOnline;
        return;
      }

      if (lastWasOnline === false && isOnline === true) {
        await annCh.send(`🚀 **LIVE!** ${stats.name} sekarang ada **${fmt(stats.playing)}** pemain online!`);
      }

      if (lastWasOnline === true && isOnline === false) {
        await annCh.send(`🛑 **OFFLINE** ${stats.name} sekarang **0** pemain online.`);
      }

      lastWasOnline = isOnline;
    } catch (err) {
      // Jangan crash bot — cuma log
      console.error("[LIVE LOOP ERROR]", err?.message || err);
    }
  };

  // langsung jalan + interval
  await tick();
  setInterval(tick, cfg.LIVE_UPDATE_INTERVAL);
}

module.exports = { startLiveLoop };
