const { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID } = require("./config");

const commands = [
  new SlashCommandBuilder()
    .setName("online")
    .setDescription("Cek player online Veridia sekarang"),

  new SlashCommandBuilder()
    .setName("status")
    .setDescription("Status lengkap Veridia (online, visits, favorites, dll)"),

  new SlashCommandBuilder()
    .setName("link")
    .setDescription("Link penting Veridia"),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("List command bot"),

  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Kirim pengumuman (admin only)")
    .addStringOption(opt =>
      opt.setName("text")
        .setDescription("Isi pengumuman")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
].map(c => c.toJSON());

const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log("Deploying commands...");
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );
    console.log("✅ Commands deployed!");
  } catch (e) {
    console.error(e);
  }
})();
