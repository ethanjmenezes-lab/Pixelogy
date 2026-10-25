import { dbPromise, readGame, readProfile, readArtwork } from "../lib/storage";
import { guestId } from "./local";
import { readGuestStory } from "./story";
import { cloudSession, rpc } from "../cloud/client";
import { defaultProfile } from "../world/profile";
let pending: Promise<void> | null = null;
export function backupGuest() {
  if (!pending)
    pending = transfer().finally(() => {
      pending = null;
    });
  return pending;
}
async function transfer() {
  const session = await cloudSession();
  if (!session) return;
  const game = await readGame(),
    profile = await readProfile(),
    story = await readGuestStory();
  if (
    !game.items.length &&
    !game.claims.length &&
    !game.player.xp &&
    !game.progression.xp &&
    !story.watched.length &&
    JSON.stringify(profile) === JSON.stringify(defaultProfile)
  )
    return;
  const legacyArt: Record<string, string> = {};
  for (const item of game.items.filter((i) => !i.catalogId)) {
    const art = await readArtwork(item.sprite.thumbnailBlobKey);
    if (art) {
      const bytes = new Uint8Array(await art.arrayBuffer());
      let binary = "";
      for (const b of bytes) binary += String.fromCharCode(b);
      legacyArt[item.id] = "data:image/png;base64," + btoa(binary);
    }
  }
  const source = await guestId(),
    snapshot = JSON.stringify({
      version: 1,
      source,
      items: game.items.map((i) =>
        legacyArt[i.id] ? { ...i, legacyArt: legacyArt[i.id] } : i,
      ),
      claims: game.claims,
      player: game.player,
      progression: game.progression,
      loadout: game.loadout,
      profile,
      story,
    });
  const hash = Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", new TextEncoder().encode(snapshot)),
    ),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");
  const result = await rpc<{ hash: string }>("import_guest", { snapshot });
  if (result.hash !== hash)
    throw new Error(
      "Guest backup verification failed. Your device save is intact.",
    );
  if ((await cloudSession())?.user.id !== session.user.id) return;
  const db = await dbPromise;
  // Compare under a write transaction: another tab's new progress must not be cleared.
  const tx = db.transaction(
    [
      "guest",
      "collectibles",
      "cleanupEvents",
      "loadouts",
      "profiles",
      "playerProgression",
      "battleProgression",
      "battleRewards",
      "artBlobs",
      "discoveryEvents",
    ],
    "readwrite",
  );
  const currentPlayer = await tx.objectStore("playerProgression").get("local"),
    currentCrab = await tx.objectStore("battleProgression").get("local");
  if (
    JSON.stringify(
      (await tx.objectStore("profiles").get("local")) ?? defaultProfile,
    ) !== JSON.stringify(profile) ||
    JSON.stringify((await tx.objectStore("loadouts").get("local")) ?? {}) !==
      JSON.stringify(game.loadout) ||
    (await tx.objectStore("collectibles").count()) !== game.items.length ||
    (await tx.objectStore("cleanupEvents").count()) !== game.claims.length ||
    JSON.stringify(currentPlayer) !== JSON.stringify(game.player) ||
    JSON.stringify(currentCrab) !== JSON.stringify(game.progression) ||
    JSON.stringify(
      (await tx.objectStore("guest").get("story")) ?? {
        progress: [],
        watched: [],
      },
    ) !== JSON.stringify(story)
  ) {
    await tx.done;
    return;
  }
  // Keep a local recovery archive, scoped to the owner and never read in guest mode.
  await tx
    .objectStore("guest")
    .put(snapshot, "archive:" + session.user.id + ":" + source);
  const keys = await tx.objectStore("guest").getAllKeys();
  for (const key of keys)
    if (!key.startsWith("archive:")) await tx.objectStore("guest").delete(key);
  for (const name of [
    "collectibles",
    "cleanupEvents",
    "loadouts",
    "profiles",
    "playerProgression",
    "battleProgression",
    "battleRewards",
    "artBlobs",
    "discoveryEvents",
  ] as const)
    await tx.objectStore(name).clear();
  await tx.done;
}
