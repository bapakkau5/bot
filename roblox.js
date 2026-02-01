const UNIVERSE_ID = process.env.UNIVERSE_ID;

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "VeridiaBot/1.0" }
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Roblox API error ${res.status} ${res.statusText} :: ${t}`);
  }
  return res.json();
}

async function getUniverseStats(universeId) {
  // playing, visits, favorites
  const url = `https://games.roblox.com/v1/games?universeIds=${encodeURIComponent(universeId)}`;
  const data = await fetchJson(url);

  const g = data?.data?.[0];
  if (!g) throw new Error("Universe tidak ketemu. Cek UNIVERSE_ID.");

  return {
    name: g.name,
    playing: g.playing ?? 0,
    visits: g.visits ?? 0,
    favorites: g.favoritedCount ?? 0,
    maxPlayers: g.maxPlayers ?? null
  };
}

async function getRobloxUserByUsername(username) {
  const url = `https://users.roblox.com/v1/users/get-by-username?username=${encodeURIComponent(username)}`;
  return fetchJson(url); // { id, name, displayName }
}

async function getRobloxUserProfile(userId) {
  const url = `https://users.roblox.com/v1/users/${encodeURIComponent(userId)}`;
  return fetchJson(url); // info profile
}

async function getRobloxHeadshot(userId) {
  const url = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${encodeURIComponent(
    userId
  )}&size=420x420&format=Png&isCircular=false`;
  const data = await fetchJson(url);
  return data?.data?.[0]?.imageUrl ?? null;
}

module.exports = {
  getUniverseStats,
  getRobloxUserByUsername,
  getRobloxUserProfile,
  getRobloxHeadshot
};
