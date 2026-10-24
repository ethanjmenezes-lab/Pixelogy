import { cloudSession, rpc } from "../cloud/client";
import {
  normalizeProgression,
  ownedBlueprints,
  mainAtLevel,
  crabLevel,
  specialMoves,
  type BattleProgression,
  type MoveId,
} from "./moves";
import { battleXpAward, type BattleState } from "./battle";
import { defaultProfile, validProfile, type Profile } from "../world/profile";
import { cleanupAward, rollRarity } from "./rewards";
import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import {
  categories,
  catalog,
  equip,
  gearFor,
  slots,
  type Collectible,
  type Equipment,
  type Category,
} from "./gear";
export type CleanupClaim = {
  eventId: string;
  collectibleId: string;
  confirmedAtIso: string;
  category: Category;
  xpAwarded: 10 | 15;
  selfReported: true;
};
export interface PixelDB extends DBSchema {
  battleProgression: { key: string; value: BattleProgression };
  battleRewards: {
    key: string;
    value: {
      matchId: string;
      xp: number;
      winnerId: string;
      createdAtIso: string;
    };
  };
  preferences: { key: string; value: { version: 1; analysisConsent: boolean } };
  profiles: { key: string; value: Profile };
  collectibles: { key: string; value: Collectible };
  artBlobs: {
    key: string;
    value: Blob | { bytes: ArrayBuffer; type: "image/png" };
  };
  discoveryEvents: {
    key: string;
    value: { collectibleId: string; createdAtIso: string };
  };
  cleanupEvents: {
    key: string;
    value: CleanupClaim;
    indexes: { "by-collectible": string };
  };
  loadouts: { key: string; value: Equipment };
}
export function upgradePixelDB(db: IDBPDatabase<PixelDB>, oldVersion: number) {
  if (oldVersion < 1) {
    db.createObjectStore("collectibles", { keyPath: "id" });
    db.createObjectStore("artBlobs");
    db.createObjectStore("discoveryEvents", { keyPath: "collectibleId" });
    db.createObjectStore("cleanupEvents", { keyPath: "eventId" }).createIndex(
      "by-collectible",
      "collectibleId",
      { unique: true },
    );
    db.createObjectStore("loadouts");
  }
  if (oldVersion < 2) db.createObjectStore("profiles");
  if (oldVersion < 3) db.createObjectStore("preferences");
  if (oldVersion < 4) {
    db.createObjectStore("battleProgression");
    db.createObjectStore("battleRewards", { keyPath: "matchId" });
  }
}
export const dbPromise = openDB<PixelDB>("pixelogy-v4", 4, {
  upgrade: upgradePixelDB,
});
export async function readGame() {
  const db = await dbPromise;
  const tx = db.transaction(
    ["collectibles", "cleanupEvents", "loadouts", "battleProgression"],
    "readwrite",
  );
  const [items, claims, raw, rawProgression] = await Promise.all([
    tx.objectStore("collectibles").getAll(),
    tx.objectStore("cleanupEvents").getAll(),
    tx.objectStore("loadouts").get("local"),
    tx.objectStore("battleProgression").get("local"),
  ]);
  const loadout: Equipment = {};
  let repaired = false;
  for (const slot of slots) {
    if (raw?.[slot]) {
      try {
        Object.assign(loadout, equip(loadout, items, slot, raw[slot]!));
      } catch {
        repaired = true;
      }
    }
  }
  if (repaired) await tx.objectStore("loadouts").put(loadout, "local");
  const progression = normalizeProgression(
    rawProgression,
    ownedBlueprints(loadout, items),
  );
  await tx.objectStore("battleProgression").put(progression, "local");
  await tx.done;
  return {
    items: items.sort((a, b) => b.createdAtIso.localeCompare(a.createdAtIso)),
    claims,
    loadout,
    repaired,
    progression,
  };
}
export async function saveDiscovery(input: {
  id: string;
  category: Category;
  subtype: "magazine" | null;
  label: string;
  safety: "allowed" | "uncertain" | "hazardous";
  art: Blob;
}): Promise<Collectible> {
  if (input.safety !== "allowed" || !categories.includes(input.category))
    throw new Error("Only reviewed safe litter can be collected.");
  if (input.subtype && input.category !== "paper_cardboard")
    throw new Error("Invalid item subtype.");
  if (
    !input.label.trim() ||
    input.label.length > 80 ||
    input.art.type !== "image/png"
  )
    throw new Error("Invalid discovery.");
  // Materialize PNG bytes before opening the transaction: WebKit may reject Blob storage.
  const artBytes = await input.art.arrayBuffer();
  const db = await dbPromise;
  const tx = db.transaction(
    ["collectibles", "artBlobs", "discoveryEvents"],
    "readwrite",
  );
  const existing = await tx.objectStore("collectibles").get(input.id);
  if (existing) {
    await tx.done;
    return existing;
  }
  const createdAtIso = new Date().toISOString();
  const gear = gearFor(input.category, input.subtype);
  const random = crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
  const item: Collectible = {
    id: input.id,
    createdAtIso,
    category: input.category,
    subtype: input.subtype,
    label: input.label.trim(),
    rarity: rollRarity(random),
    gearBlueprintId: gear?.id ?? null,
    gearRulesVersion: 1,
    sprite: { thumbnailBlobKey: input.id, width: 256, height: 256 },
  };
  await tx.objectStore("collectibles").add(item);
  await tx
    .objectStore("artBlobs")
    .put({ bytes: artBytes, type: "image/png" }, input.id);
  await tx
    .objectStore("discoveryEvents")
    .add({ collectibleId: input.id, createdAtIso });
  await tx.done;
  return item;
}
export async function claimCleanup(
  collectibleId: string,
  eventId: string,
): Promise<CleanupClaim> {
  if (await cloudSession()) {
    const c = await rpc<{
      id: string;
      discovery_id: string;
      category: Category;
      claimed_at: string;
      xp: 10 | 15;
    }>("claim_cleanup", { discovery: collectibleId });
    return {
      eventId: c.id,
      collectibleId: c.discovery_id,
      category: c.category,
      confirmedAtIso: c.claimed_at,
      xpAwarded: c.xp,
      selfReported: true,
    };
  }
  const db = await dbPromise;
  const tx = db.transaction(["collectibles", "cleanupEvents"], "readwrite");
  const store = tx.objectStore("cleanupEvents");
  const existing = await store.index("by-collectible").get(collectibleId);
  if (existing) {
    await tx.done;
    return existing;
  }
  const item = await tx.objectStore("collectibles").get(collectibleId);
  if (!item) {
    tx.abort();
    await tx.done.catch(() => {});
    throw new Error("Save the discovery first.");
  }
  const claims = await store.getAll();
  if (claims.some((c) => c.eventId === eventId)) {
    tx.abort();
    await tx.done.catch(() => {});
    throw new Error("Cleanup event already used.");
  }
  const claim: CleanupClaim = {
    eventId,
    collectibleId,
    category: item.category,
    confirmedAtIso: new Date().toISOString(),
    xpAwarded: cleanupAward(
      item.category,
      claims.map((c) => c.category),
    ),
    selfReported: true,
  };
  await store.add(claim);
  await tx
    .objectStore("collectibles")
    .put({ ...item, cleanupClaimedAtIso: claim.confirmedAtIso });
  await tx.done;
  return claim;
}
export async function saveEquipment(
  slot: Parameters<typeof equip>[2],
  id: string | null,
) {
  if (await cloudSession()) {
    await rpc("equip_discovery", { slot_name: slot, discovery: id });
    return;
  }
  const db = await dbPromise;
  const tx = db.transaction(
    ["collectibles", "loadouts", "battleProgression"],
    "readwrite",
  );
  const items = await tx.objectStore("collectibles").getAll();
  const current = (await tx.objectStore("loadouts").get("local")) ?? {};
  try {
    const next = equip(current, items, slot, id);
    await tx.objectStore("loadouts").put(next, "local");
    const progression = normalizeProgression(
      await tx.objectStore("battleProgression").get("local"),
      ownedBlueprints(next, items),
    );
    await tx.objectStore("battleProgression").put(progression, "local");
    await tx.done;
    return next;
  } catch (error) {
    tx.abort();
    await tx.done.catch(() => {});
    throw error;
  }
}
export function equippedBlueprints(loadout: Equipment, items: Collectible[]) {
  return slots.flatMap((slot) => {
    const item = items.find((i) => i.id === loadout[slot]);
    return item?.gearBlueprintId && catalog[item.gearBlueprintId]
      ? [item.gearBlueprintId]
      : [];
  });
}

export async function readProfile() {
  return (await (await dbPromise).get("profiles", "local")) ?? defaultProfile;
}
export async function saveProfile(profile: Profile) {
  if (await cloudSession()) {
    if (!validProfile(profile)) throw new Error("Invalid profile");
    await rpc("save_appearance", { appearance: profile });
    return;
  }
  if (!validProfile(profile))
    throw new Error("Please choose a valid explorer name and appearance.");
  await (
    await dbPromise
  ).put("profiles", { ...profile, nickname: profile.nickname.trim() }, "local");
}

export async function readArtwork(key: string) {
  const art = await (await dbPromise).get("artBlobs", key);
  if (!art) return undefined;
  return art instanceof Blob ? art : new Blob([art.bytes], { type: art.type });
}

export async function readConsent() {
  return (
    (await (await dbPromise).get("preferences", "privacy"))?.analysisConsent ===
    true
  );
}
export async function saveConsent(analysisConsent: boolean) {
  await (
    await dbPromise
  ).put("preferences", { version: 1, analysisConsent }, "privacy");
}

export async function saveMoveSelection(slot: "main" | "special", id: MoveId) {
  if (await cloudSession()) {
    await rpc("choose_move", { slot_name: slot, move_id: id });
    return;
  }
  const db = await dbPromise;
  const tx = db.transaction(
    ["collectibles", "loadouts", "battleProgression"],
    "readwrite",
  );
  try {
    const items = await tx.objectStore("collectibles").getAll();
    const loadout = (await tx.objectStore("loadouts").get("local")) ?? {};
    const blueprints = ownedBlueprints(loadout, items);
    const progression = normalizeProgression(
      await tx.objectStore("battleProgression").get("local"),
      blueprints,
    );
    const eligible =
      slot === "main"
        ? mainAtLevel(crabLevel(progression.xp))
        : slot === "special"
          ? specialMoves(blueprints)
          : [];
    if (!eligible.includes(id))
      throw new Error("This move is locked or its gear is not equipped.");
    await tx
      .objectStore("battleProgression")
      .put({ ...progression, [slot]: id }, "local");
    await tx.done;
  } catch (error) {
    tx.abort();
    await tx.done.catch(() => {});
    throw error;
  }
}
// Local practice bookkeeping only, not a trusted multiplayer/leaderboard endpoint.
export async function recordBattleResult(battle: BattleState) {
  const xp = battleXpAward(battle);
  if (
    !xp ||
    battle.mode !== "practice" ||
    !["player", "cpu"].includes(battle.winnerId ?? "") ||
    !battle.fighters.some(
      (f) => f.userId === battle.winnerId && f.currentHp > 0,
    ) ||
    !battle.winnerId ||
    !battle.id ||
    !battle.log.length ||
    battle.currentActorId !== null ||
    !battle.fighters.some(
      (f) => f.currentHp === 0 && f.userId !== battle.winnerId,
    )
  )
    throw new Error("Only completed practice matches earn battle XP.");
  const db = await dbPromise;
  const tx = db.transaction(
    ["battleRewards", "battleProgression", "collectibles", "loadouts"],
    "readwrite",
  );
  try {
    const existing = await tx.objectStore("battleRewards").get(battle.id);
    if (existing) {
      await tx.done;
      return existing;
    }
    const items = await tx.objectStore("collectibles").getAll();
    const loadout = (await tx.objectStore("loadouts").get("local")) ?? {};
    const blueprints = ownedBlueprints(loadout, items);
    const before = normalizeProgression(
      await tx.objectStore("battleProgression").get("local"),
      blueprints,
    );
    const next = normalizeProgression(
      { ...before, xp: Math.min(Number.MAX_SAFE_INTEGER, before.xp + xp) },
      blueprints,
    );
    const reward = {
      matchId: battle.id,
      xp,
      winnerId: battle.winnerId,
      createdAtIso: new Date().toISOString(),
    };
    await tx.objectStore("battleRewards").add(reward);
    await tx.objectStore("battleProgression").put(next, "local");
    await tx.done;
    return reward;
  } catch (error) {
    try {
      tx.abort();
    } catch {
      /* The failed request may already have aborted it. */
    }
    await tx.done.catch(() => {});
    throw error;
  }
}
