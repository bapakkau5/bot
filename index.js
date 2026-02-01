const fs = require("fs");
const path = require("path");
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder
} = require("discord.js");

const {
  DISCORD_TOKEN,
  LIVE_CHANNEL_ID,
  ANNOUNCE_CHANNEL_ID,
  WEBSITE_URL,
  ROBLOX_URL,
  DISCORD_INVITE
} = require("./config");

const { getUniverseStats } = require("./roblox");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const dataDir = path.join(__dirname, "data");
const liveFile = path.join(dataDir, "liveMessage.json");

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
}

function readLiveState() {
  try {
    return JSON.parse(fs.readFileSync(liveFile, "utf8"));
  } catch {
    return {};
  }
}

function writeLiveState(obj) {
  ensureDataDir();
  fs.writeFileSync(liveFile, JSON.stringify(obj, null, 2), "utf8");
}

function buildStatusEmbed(stats) {
  return new EmbedBuilder()
    .setTitle(`🏔️ ${stats.name || "Mount Veridia"} — Live Status`)
    .setDescription(`🟢 **Online sekarang:** **${stats.playing}**`)
    .addFields(
      { name: "👀 Visits", value: `${stats.visits}`, inline: true },
      { name: "⭐ Favorites", value: `${stats.favorites}`, inline: true },
      { name: "👥 Max Players / Server", value: stats.maxPlayers ? `${stats.maxPlayers}` : "-", inline: true }
    )
    .setFooter({ text: "Auto update setiap 60 detik" })
    .setTimestamp(new Date());
}

async function upsertLiveMessage() {
  const channel = await client.channels.fetch(LIVE_CHANNEL_ID);
  if (!channel || !channel.isTextBased()) return;

  const stats = await getUniverseStats();
  const embed = buildStatusEmbed(stats);

  const state = readLiveState();
  const oldId = state.messageId;

  // kalau udah pernah ada messageId -> edit
  if (oldId) {
    try {
      const msg = await channel.messages.fetch(oldId);
      await msg.edit({ embeds: [embed] });
      return;
    } catch {
      // kalau gagal fetch/edit (kehapus) -> bikin baru
    }
  }

  const newMsg = await channel.send({ embeds: [embed] });
  writeLiveState({ messageId: newMsg.id });
}

function linksText() {
  let s = `🌐 Website: ${WEBSITE_URL}\n🎮 Roblox: ${ROBLOX_URL}`;
  if (DISCORD_INVITE) s += `\n💬 Discord: ${DISCORD_INVITE}`;
  return s;
}

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  // live status loop
  const tick = async () => {
    try {
      await upsertLiveMessage();
    } catch (e) {
      console.log("Live status error:", e.message);
    }
  };

  await tick();
  setInterval(tick, 60_000);
});

client.on("interactionCreate", async (i) => {
  if (!i.isChatInputCommand()) return;

  try {
    if (i.commandName === "online") {
      const stats = await getUniverseStats();
      await i.reply(`🟢 **Online sekarang:** **${stats.playing}**`);
    }

    if (i.commandName === "status") {
      const stats = await getUniverseStats();
      const embed = buildStatusEmbed(stats);
      await i.reply({ embeds: [embed] });
    }

    if (i.commandName === "link") {
      await i.reply(linksText());
    }

    if (i.commandName === "help") {
      await i.reply(
        [
          "**📌 Veridia Bot Commands**",
          "`/online` - cek player online",
          "`/status` - status lengkap (online/visits/favorites)",
          "`/link` - link penting",
          "`/help` - bantuan",
          "`/announce text:` - pengumuman (admin only)"
        ].join("\n")
      );
    }

    if (i.commandName === "announce") {
      const text = i.options.getString("text", true);
      const ch = await client.channels.fetch(ANNOUNCE_CHANNEL_ID);
      if (!ch || !ch.isTextBased()) {
        await i.reply({ content: "❌ Channel announce tidak valid.", ephemeral: true });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle("📣 Pengumuman Veridia")
        .setDescription(text)
        .setTimestamp(new Date());

      await ch.send({ embeds: [embed] });
      await i.reply({ content: "✅ Pengumuman terkirim!", ephemeral: true });
    }
  } catch (e) {
    console.error(e);
    if (i.replied || i.deferred) {
      await i.followUp({ content: `❌ Error: ${e.message}`, ephemeral: true });
    } else {
      await i.reply({ content: `❌ Error: ${e.message}`, ephemeral: true });
    }
  }
});

client.login(DISCORD_TOKEN);
