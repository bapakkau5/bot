const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder
} = require("discord.js");

const cfg = require("./config");
const {
  getUniverseStats,
  getRobloxUserByUsername,
  getRobloxUserProfile,
  getRobloxHeadshot
} = require("./roblox");

const { startLiveLoop } = require("./live");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,     // buat welcome DM
    GatewayIntentBits.GuildMessages,    // prefix command
    GatewayIntentBits.MessageContent,   // baca isi chat
    GatewayIntentBits.GuildPresences    // aman aja, & biar ga crash kalo code butuh
  ],
  partials: [Partials.Channel]
});

function isOwner(msg) {
  return msg.guild && msg.author.id === msg.guild.ownerId;
}

function fmt(n) {
  if (typeof n !== "number") return "0";
  return n.toLocaleString("en-US");
}

function statusEmbed(stats) {
  return new EmbedBuilder()
    .setTitle("Mount Veridia Status")
    .setDescription(`**${stats.name}**`)
    .addFields(
      { name: "Online sekarang", value: `${fmt(stats.playing)}`, inline: true },
      { name: "Favorites", value: `${fmt(stats.favorites)}`, inline: true },
      { name: "Visits", value: `${fmt(stats.visits)}`, inline: true }
    )
    .setURL(cfg.SITE_LINK)
    .setFooter({ text: "Veridia Bot" })
    .setTimestamp(new Date());
}

// ✅ Welcome DM (pas member join)
client.on("guildMemberAdd", async (member) => {
  try {
    if (member.guild.id !== cfg.GUILD_ID) return;

    const text = cfg.WELCOME_DM(member.user.username, cfg.SITE_LINK);
    await member.send({ content: text });
  } catch (e) {
    // Banyak user matiin DM — ini normal, jangan crash
    console.log("[WELCOME DM] gagal kirim DM:", e?.message || e);
  }
});

// ✅ Prefix commands
client.on("messageCreate", async (msg) => {
  try {
    if (!msg.guild) return;
    if (msg.guild.id !== cfg.GUILD_ID) return;
    if (msg.author.bot) return;

    const content = msg.content.trim();
    if (!content.startsWith(cfg.PREFIX)) return;

    const args = content.slice(cfg.PREFIX.length).trim().split(/\s+/);
    const cmd = (args.shift() || "").toLowerCase();

    if (!cmd) return;

    if (cmd === "help") {
      return msg.reply(
        [
          "**Veridia Bot Commands**",
          `\`${cfg.PREFIX}status\` → info map (online/visits/favorites)`,
          `\`${cfg.PREFIX}online\` → jumlah online sekarang`,
          `\`${cfg.PREFIX}cekuser <username>\` → cek profil Roblox`,
          `\`${cfg.PREFIX}send #channel pesan...\` → (owner only) kirim pesan ke channel`,
          "",
          `Link: ${cfg.SITE_LINK}`
        ].join("\n")
      );
    }

    if (cmd === "status") {
      const stats = await getUniverseStats(cfg.UNIVERSE_ID);
      return msg.reply({ embeds: [statusEmbed(stats)] });
    }

    if (cmd === "online") {
      const stats = await getUniverseStats(cfg.UNIVERSE_ID);
      return msg.reply(`👥 Online sekarang di **${stats.name}**: **${fmt(stats.playing)}**`);
    }

    if (cmd === "cekuser") {
      const q = args.join(" ").trim();
      if (!q) return msg.reply(`Pakai: \`${cfg.PREFIX}cekuser <username>\``);

      const basic = await getRobloxUserByUsername(q);
      const prof = await getRobloxUserProfile(basic.id);
      const headshot = await getRobloxHeadshot(basic.id);

      const e = new EmbedBuilder()
        .setTitle(`${basic.displayName} (@${basic.name})`)
        .setURL(`https://www.roblox.com/users/${basic.id}/profile`)
        .addFields(
          { name: "User ID", value: `${basic.id}`, inline: true },
          { name: "Created", value: prof.created ? `<t:${Math.floor(new Date(prof.created).getTime()/1000)}:R>` : "-", inline: true },
          { name: "Description", value: prof.description?.slice(0, 200) || "(kosong)", inline: false }
        )
        .setThumbnail(headshot || null)
        .setFooter({ text: "Roblox Profile" })
        .setTimestamp(new Date());

      return msg.reply({ embeds: [e] });
    }

    if (cmd === "send") {
      if (!isOwner(msg)) return msg.reply("❌ Command ini khusus **Owner server**.");

      const chRaw = args.shift();
      if (!chRaw) return msg.reply(`Pakai: \`${cfg.PREFIX}send #channel pesan...\``);

      const channelId = chRaw.replace(/[<#>]/g, "");
      const channel = await msg.guild.channels.fetch(channelId).catch(() => null);
      if (!channel?.isTextBased?.()) return msg.reply("❌ Channel ga valid.");

      const text = args.join(" ").trim();
      if (!text) return msg.reply("❌ Pesannya kosong.");

      await channel.send(text);
      return msg.reply("✅ Terkirim.");
    }

    return msg.reply(`Command ga ada. Coba \`${cfg.PREFIX}help\``);
  } catch (err) {
    console.error("[COMMAND ERROR]", err?.message || err);
    return msg.reply("❌ Error. Cek logs Railway.");
  }
});

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  // Start live loop (auto update + announce)
  await startLiveLoop(client);
});

client.login(cfg.DISCORD_TOKEN);
