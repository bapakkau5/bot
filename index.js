const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder
} = require("discord.js");

const cfg = require("./config");
const roblox = require("./roblox");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent // WAJIB untuk prefix command
  ],
  partials: [Partials.Channel]
});

let liveMessageId = null;
let lastPlaying = null;

function isOwner(userId) {
  if (!cfg.OWNER_IDS.length) return false;
  return cfg.OWNER_IDS.includes(String(userId));
}

function formatNumber(n) {
  try { return Number(n).toLocaleString("en-US"); } catch { return String(n); }
}

function makeStatusEmbed(info) {
  return new EmbedBuilder()
    .setTitle(`🌋 ${info.name}`)
    .setDescription("Live Status (auto update)")
    .addFields(
      { name: "🟢 Online sekarang", value: `**${formatNumber(info.playing)}**`, inline: true },
      { name: "⭐ Favorites", value: `**${formatNumber(info.favorites)}**`, inline: true },
      { name: "👀 Visits", value: `**${formatNumber(info.visits)}**`, inline: true },
      { name: "👥 Max Players / Server", value: `**${formatNumber(info.maxPlayers)}**`, inline: true },
      { name: "🆔 Universe ID", value: `\`${info.universeId}\``, inline: true },
      { name: "🎮 Root Place ID", value: `\`${info.rootPlaceId}\``, inline: true }
    )
    .setFooter({ text: "VERIDIA_BOT_LIVE_STATUS" })
    .setTimestamp(new Date());
}

async function getOrCreateLiveMessage(channel, embed) {
  // Kalau sudah ada messageId di memori, coba edit
  if (liveMessageId) {
    try {
      const msg = await channel.messages.fetch(liveMessageId);
      await msg.edit({ embeds: [embed] });
      return msg;
    } catch {
      liveMessageId = null;
    }
  }

  // Cari message lama yang dibuat bot, footer khusus
  const msgs = await channel.messages.fetch({ limit: 25 }).catch(() => null);
  if (msgs) {
    const found = msgs.find(m => {
      if (m.author?.id !== client.user.id) return false;
      const e = m.embeds?.[0];
      const footer = e?.footer?.text;
      return footer === "VERIDIA_BOT_LIVE_STATUS";
    });

    if (found) {
      liveMessageId = found.id;
      await found.edit({ embeds: [embed] });
      return found;
    }
  }

  // Kalau gak ada, bikin baru
  const sent = await channel.send({ embeds: [embed] });
  liveMessageId = sent.id;
  return sent;
}

async function postAnnounce(text) {
  if (!cfg.ANNOUNCE_CHANNEL_ID) return; // opsional
  const ch = await client.channels.fetch(cfg.ANNOUNCE_CHANNEL_ID).catch(() => null);
  if (!ch) return;
  await ch.send(text).catch(() => {});
}

async function updateLiveLoop() {
  const channel = await client.channels.fetch(cfg.LIVE_CHANNEL_ID).catch(() => null);
  if (!channel) {
    console.error("LIVE_CHANNEL_ID not found / bot has no access");
    return;
  }

  const info = await roblox.getUniverseInfo(cfg.UNIVERSE_ID);
  const embed = makeStatusEmbed(info);
  await getOrCreateLiveMessage(channel, embed);

  // announce kalau berubah (optional)
  if (lastPlaying !== null && info.playing !== lastPlaying) {
    await postAnnounce(`📣 Online berubah: **${formatNumber(lastPlaying)}** → **${formatNumber(info.playing)}**`);
  }
  lastPlaying = info.playing;
}

function parseChannelId(token) {
  // token bisa: <#123> atau 123
  const t = String(token || "").trim();
  const m = t.match(/^<#(\d+)>$/);
  if (m) return m[1];
  if (/^\d+$/.test(t)) return t;
  return null;
}

async function handleCommand(message) {
  const { PREFIX } = cfg;
  if (!message.content.startsWith(PREFIX)) return;

  const raw = message.content.slice(PREFIX.length).trim();
  if (!raw) return;

  const parts = raw.split(/\s+/);
  const cmd = (parts.shift() || "").toLowerCase();

  if (cmd === "help") {
    return message.reply(
      [
        "**VERIDIA BOT Commands**",
        "`;help` - list command",
        "`;online` - cek online sekarang (players)",
        "`;status` - status lengkap (online/visits/favorites/max players)",
        "`;cekuser <username|userId>` - tampilkan profil Roblox",
        "`;send #channel pesan...` - (OWNER) kirim pesan ke channel"
      ].join("\n")
    );
  }

  if (cmd === "online") {
    const info = await roblox.getUniverseInfo(cfg.UNIVERSE_ID);
    return message.reply(`🟢 Online sekarang di **${info.name}**: **${formatNumber(info.playing)}**`);
  }

  if (cmd === "status") {
    const info = await roblox.getUniverseInfo(cfg.UNIVERSE_ID);
    const embed = makeStatusEmbed(info);
    return message.reply({ embeds: [embed] });
  }

  if (cmd === "cekuser") {
    const q = parts.join(" ").trim();
    if (!q) return message.reply("Pakai: `;cekuser <username atau userId>`");

    try {
      const u = await roblox.resolveUser(q);
      const url = `https://www.roblox.com/users/${u.id}/profile`;

      const e = new EmbedBuilder()
        .setTitle(`👤 Roblox User: ${u.displayName} (@${u.name})`)
        .setURL(url)
        .addFields(
          { name: "User ID", value: `\`${u.id}\``, inline: true },
          { name: "Created", value: u.created ? `\`${u.created}\`` : "`unknown`", inline: true }
        )
        .setDescription(u.description ? u.description.slice(0, 300) : "—")
        .setThumbnail(u.avatar || null)
        .setFooter({ text: "VERIDIA_BOT_CEKUSER" })
        .setTimestamp(new Date());

      return message.reply({ embeds: [e] });
    } catch (err) {
      return message.reply(`❌ Gagal cek user: ${err.message}`);
    }
  }

  if (cmd === "send") {
    if (!isOwner(message.author.id)) {
      return message.reply("❌ Command ini khusus OWNER.");
    }

    const chToken = parts.shift();
    const channelId = parseChannelId(chToken);
    if (!channelId) {
      return message.reply("Pakai: `;send #channel pesan...`");
    }

    const text = parts.join(" ").trim();
    if (!text) return message.reply("Pesannya kosong.");

    const ch = await client.channels.fetch(channelId).catch(() => null);
    if (!ch) return message.reply("Channel tidak ketemu / bot gak punya akses.");

    await ch.send(text);
    return message.reply("✅ Ke-send.");
  }

  // unknown command
  return message.reply("Command gak dikenal. Coba `;help`.");
}

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // run sekali pas start
  await updateLiveLoop().catch(err => console.error("updateLiveLoop error:", err));

  // loop auto update
  setInterval(() => {
    updateLiveLoop().catch(err => console.error("updateLiveLoop error:", err));
  }, cfg.UPDATE_INTERVAL_MS);
});

client.on("messageCreate", async (message) => {
  if (!message.guild) return;
  if (message.author.bot) return;

  try {
    await handleCommand(message);
  } catch (err) {
    console.error("Command error:", err);
    try { await message.reply(`❌ Error: ${err.message}`); } catch {}
  }
});

client.login(cfg.DISCORD_TOKEN);
