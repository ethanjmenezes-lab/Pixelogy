import { openDB } from "idb";
import { cloud, cloudSession } from "./client";
import { catalogById } from "../catalog";
import type { Collectible, Equipment } from "../lib/gear";
import type { CleanupClaim } from "../lib/storage";
import { normalizeProgression, ownedBlueprints } from "../lib/moves";
import { defaultProfile, validProfile, type Profile } from "../world/profile";
type CloudGame = {
  items: Collectible[];
  loadout: Equipment;
  claims: CleanupClaim[];
  progression: ReturnType<typeof normalizeProgression>;
  profile: Profile;
  repaired: boolean;
  offline: boolean;
  userId: string;
};
export async function fetchCloudGame(): Promise<CloudGame | null> {
  const session = await cloudSession();
  if (!session || !cloud) return null;
  const cache = await openDB("pixelogy-account-cache", 1, {
    upgrade(db) {
      db.createObjectStore("snapshots");
    },
  });
  try {
    const tables = [
      "player_discoveries",
      "crab_equipment",
      "player_progression",
      "selected_moves",
      "cleanup_claims",
      "player_profiles",
    ] as const;
    const values = await Promise.all(
      tables.map(async (table) => {
        const { data, error } = await cloud!
          .from(table)
          .select("*")
          .eq("user_id", session.user.id);
        if (error) throw error;
        return data;
      }),
    );
    const [
      discoveries,
      equipment,
      progressions,
      selections,
      cleanups,
      profiles,
    ] = values;
    const items: Collectible[] = discoveries.map((d) => {
      const c = catalogById[d.catalog_id];
      if (!c) throw new Error("Catalog update required.");
      return {
        id: d.id,
        catalogId: c.id,
        createdAtIso: d.discovered_at,
        category: c.gearCategory,
        subtype: c.gearId === "magazine_mail" ? "magazine" : null,
        label: c.name,
        rarity: c.rarity,
        gearBlueprintId: c.gearId,
        gearRulesVersion: 1,
        sprite: { thumbnailBlobKey: "", width: 32, height: 32 },
      };
    });
    const loadout = Object.fromEntries(
      equipment.map((e) => [e.slot, e.discovery_id]),
    ) as Equipment;
    const claims: CleanupClaim[] = cleanups.map((c) => ({
      eventId: c.id,
      collectibleId: c.discovery_id,
      category:
        catalogById[
          discoveries.find((d) => d.id === c.discovery_id)?.catalog_id
        ]?.gearCategory ?? "other_litter",
      confirmedAtIso: c.claimed_at,
      xpAwarded: c.xp,
      selfReported: true,
    }));
    const progression = normalizeProgression(
      {
        xp: progressions[0]?.battle_xp ?? 0,
        main: selections[0]?.main,
        special: selections[0]?.special,
      },
      ownedBlueprints(loadout, items),
    );
    const appearance = profiles[0]?.appearance as Profile | undefined;
    const profile =
      appearance && validProfile(appearance) ? appearance : defaultProfile;
    const result = {
      items,
      loadout,
      claims,
      progression,
      profile,
      repaired: false,
      offline: false,
      userId: session.user.id,
    };
    await cache.put("snapshots", result, session.user.id);
    return result;
  } catch (error) {
    if (navigator.onLine) throw error;
    const cached = await cache.get("snapshots", session.user.id);
    if (cached) return { ...cached, offline: true } as CloudGame;
    throw new Error(
      "This account has no offline save on this device. Connect to load it.",
    );
  } finally {
    cache.close();
  }
}
