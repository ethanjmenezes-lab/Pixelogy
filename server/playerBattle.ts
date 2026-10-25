import type { SupabaseClient } from "@supabase/supabase-js";
import { createBattle } from "../src/lib/battle.js";
import { statsFor, type Collectible, type Equipment } from "../src/lib/gear.js";
import {
  crabLevel,
  normalizeProgression,
  ownedBlueprints,
} from "../src/lib/moves.js";
import { catalogById } from "../src/catalog/index.js";

export async function playerBattle(client: SupabaseClient, userId: string) {
  const results = await Promise.all(
    [
      "player_discoveries",
      "crab_equipment",
      "player_progression",
      "selected_moves",
    ].map((table) => client.from(table).select("*").eq("user_id", userId)),
  );
  if (results.some((r) => r.error)) throw new Error("Cloud save unavailable");
  const [discoveries, equipment, progression, selection] = results.map(
    (r) => r.data!,
  );
  const items = discoveries.map((d) => {
    const c = catalogById[d.catalog_id];
    if (!c) throw new Error("Unknown catalog entry");
    return { id: d.id, gearBlueprintId: c.gearId } as Collectible;
  });
  const loadout = Object.fromEntries(
    equipment.map((e) => [e.slot, e.discovery_id]),
  ) as Equipment;
  const blueprints = ownedBlueprints(loadout, items),
    selected = normalizeProgression(
      {
        xp: progression[0]?.battle_xp ?? 0,
        main: selection[0]?.main,
        special: selection[0]?.special,
      },
      blueprints,
    );
  return createBattle(statsFor(loadout, items), Object.values(loadout), {
    level: crabLevel(selected.xp),
    blueprints,
    moves: [selected.main, "guard", selected.special],
  });
}
