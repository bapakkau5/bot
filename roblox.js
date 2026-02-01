const UNIVERSE_ENDPOINT = (universeId) =>
  `https://games.roblox.com/v1/games?universeIds=${encodeURIComponent(universeId)}`;

async function getUniverseInfo(universeId) {
  const res = await fetch(UNIVERSE_ENDPOINT(universeId));
  if (!res.ok) throw new Error(`Roblox API error: ${res.status}`);
  const json = await res.json();

  const game = json?.data?.[0];
  if (!game) throw new Error("Universe not found / Roblox returned empty data");


  return {
    name: game.name ?? "Unknown",
    playing: Number(game.playing ?? 0),
    visits: Number(game.visits ?? 0),
    favorites: Number(game.favoritedCount ?? 0),
    maxPlayers: Number(game.maxPlayers ?? 0),
    rootPlaceId: Number(game.rootPlaceId ?? 0),
    universeId: String(universeId)
  };
}

async function resolveUser(input) {

  const raw = String(input).trim();
  if (!raw) throw new Error("Empty input");


  if (/^\d+$/.test(raw)) {
    const userId = Number(raw);
    const user = await getUserById(userId);
    return user;
  }

  const user = await getUserByUsername(raw);
  return user;
}

async function getUserById(userId) {
  const res = await fetch(`https://users.roblox.com/v1/users/${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error(`User not found (id: ${userId})`);
  const u = await res.json();
  const thumb = await getUserAvatarThumb(u.id);
  return {
    id: u.id,
    name: u.name,
    displayName: u.displayName,
    description: u.description || "",
    created: u.created || "",
    avatar: thumb
  };
}

async function getUserByUsername(username) {
  const res = await fetch("https://users.roblox.com/v1/usernames/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      usernames: [username],
      excludeBannedUsers: false
    })
  });

  if (!res.ok) throw new Error(`Roblox API error: ${res.status}`);
  const json = await res.json();
  const found = json?.data?.[0];
  if (!found) throw new Error(`Username not found: ${username}`);

  return getUserById(found.id);
}

async function getUserAvatarThumb(userId) {

  const url =
    `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${encodeURIComponent(userId)}&size=150x150&format=Png&isCircular=false`;
  const res = await fetch(url);
  if (!res.ok) return "";
  const json = await res.json();
  const img = json?.data?.[0]?.imageUrl;
  return img || "";
}

module.exports = {
  getUniverseInfo,
  resolveUser
};
