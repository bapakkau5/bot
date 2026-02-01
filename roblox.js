const fetch = (...args) => import("node-fetch").then(({default: fetch}) => fetch(...args));
const { UNIVERSE_ID } = require("./config");

async function getUniverseStats() {
  const url = `https://games.roblox.com/v1/games?universeIds=${encodeURIComponent(UNIVERSE_ID)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Roblox API error: ${res.status}`);
  const json = await res.json();

  const g = json?.data?.[0];
  if (!g) throw new Error("Roblox API: no data for that universe id");

  return {
    name: g.name,
    playing: g.playing ?? 0,
    visits: g.visits ?? 0,
    favorites: g.favoritedCount ?? 0,
    maxPlayers: g.maxPlayers ?? null,
    updated: g.updated ?? null
  };
}

module.exports = { getUniverseStats };
