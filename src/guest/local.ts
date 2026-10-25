import { dbPromise, readGame } from "../lib/storage";
import { catalogById } from "../catalog";
import { normalizeProgression, ownedBlueprints } from "../lib/moves";
import { rules, walkingAward, type WalkSegment } from "../progression/model";
import type { Collectible } from "../lib/gear";
export async function guestId() {
  const db = await dbPromise,
    tx = db.transaction("guest", "readwrite");
  let id = (await tx.store.get("id")) as string | undefined;
  if (!id) {
    id = crypto.randomUUID();
    await tx.store.put(id, "id");
  }
  await tx.done;
  return id;
}
export async function saveGuestDiscovery(catalogId: string, payload: string) {
  const c = catalogById[catalogId];
  if (!c) throw new Error("Unknown catalog match");
  const ticket = JSON.parse(payload) as {
    scanId?: string;
    candidates?: string[];
  };
  if (!ticket.scanId || !ticket.candidates?.includes(catalogId))
    throw new Error("Invalid recognition receipt");
  const db = await dbPromise,
    tx = db.transaction(["collectibles", "discoveryEvents"], "readwrite");
  const existing = await tx.objectStore("collectibles").get(ticket.scanId);
  if (existing) {
    if (existing.catalogId !== catalogId)
      throw new Error("Discovery already saved");
    await tx.done;
    return { id: existing.id, catalogId, isNew: false };
  }
  const isNew = !(await tx.objectStore("collectibles").getAll()).some(
    (i) => i.catalogId === catalogId,
  );
  const item: Collectible = {
    id: ticket.scanId,
    catalogId,
    createdAtIso: new Date().toISOString(),
    category: c.gearCategory,
    subtype: c.gearId === "magazine_mail" ? "magazine" : null,
    label: c.name,
    rarity: c.rarity,
    gearBlueprintId: c.gearId,
    gearRulesVersion: 1,
    sprite: { thumbnailBlobKey: "", width: 32, height: 32 },
  };
  await tx.objectStore("collectibles").add(item);
  await tx
    .objectStore("discoveryEvents")
    .add({ collectibleId: item.id, createdAtIso: item.createdAtIso });
  await tx.done;
  return { id: item.id, catalogId, isNew };
}
export async function creditGuestWalk(
  id: string,
  segment: WalkSegment,
  now = Date.now(),
) {
  await readGame();
  const db = await dbPromise,
    tx = db.transaction(
      [
        "guest",
        "playerProgression",
        "battleProgression",
        "collectibles",
        "loadouts",
      ],
      "readwrite",
    );
  if (await tx.objectStore("guest").get("walk:" + id)) {
    await tx.done;
    return { playerXp: 0, crabXp: 0 };
  }
  if (
    segment.durationMs < 1000 ||
    segment.durationMs > rules.maxGapMs ||
    segment.distanceMm / segment.durationMs < rules.minSpeed ||
    segment.distanceMm / segment.durationMs > rules.maxSpeed
  )
    throw new Error("Invalid walking segment");
  const day = "day:" + new Date(now).toISOString().slice(0, 10),
    used = ((await tx.objectStore("guest").get(day)) as number) || 0;
  const accepted = Math.max(
    0,
    Math.min(segment.distanceMm, rules.dailyCapMm - used),
  );
  const p = (await tx.objectStore("playerProgression").get("local"))!;
  const award = walkingAward(p.distanceMm, accepted);
  const items = await tx.objectStore("collectibles").getAll(),
    loadout = (await tx.objectStore("loadouts").get("local")) ?? {};
  const before = await tx.objectStore("battleProgression").get("local");
  await tx
    .objectStore("battleProgression")
    .put(
      normalizeProgression(
        { ...before, xp: (before?.xp ?? 0) + award.crabXp },
        ownedBlueprints(loadout, items),
      ),
      "local",
    );
  await tx
    .objectStore("playerProgression")
    .put(
      { xp: p.xp + award.playerXp, distanceMm: p.distanceMm + accepted },
      "local",
    );
  await tx.objectStore("guest").put(used + accepted, day);
  await tx.objectStore("guest").put({ accepted, ...award }, "walk:" + id);
  await tx.done;
  return award;
}
