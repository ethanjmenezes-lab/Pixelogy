export const categories = [
  "plastic_bottle",
  "aluminum_can",
  "food_wrapper",
  "disposable_cup",
  "plastic_bag",
  "bottle_cap",
  "paper_cardboard",
  "straw",
  "other_litter",
] as const;
export type Category = (typeof categories)[number];
export const categoryLabels: Record<Category, string> = {
  plastic_bottle: "Plastic bottle",
  aluminum_can: "Aluminum can",
  food_wrapper: "Food wrapper",
  disposable_cup: "Disposable cup",
  plastic_bag: "Plastic bag",
  bottle_cap: "Bottle cap",
  paper_cardboard: "Paper / cardboard",
  straw: "Straw",
  other_litter: "Other safe litter",
};
export const slots = [
  "head",
  "shell",
  "main_claw",
  "off_claw",
  "feet",
] as const;
export type GearSlot = (typeof slots)[number];
export const slotLabels: Record<GearSlot, string> = {
  head: "Head",
  shell: "Shell",
  main_claw: "Main claw",
  off_claw: "Off claw",
  feet: "Feet",
};
export type Stats = { hp: number; atk: number; def: number; spd: number };
export type Rarity = "common" | "uncommon" | "rare" | "legendary";
export type GearBlueprint = {
  id: string;
  label: string;
  slot: GearSlot;
  statBonus: Partial<Stats>;
  assetKey: string;
  rulesVersion: 1;
};
function blueprint(
  id: string,
  label: string,
  slot: GearSlot,
  statBonus: Partial<Stats>,
): GearBlueprint {
  return { id, label, slot, statBonus, assetKey: id, rulesVersion: 1 };
}
export const catalog: Record<string, GearBlueprint> = {
  bag_helm: blueprint("bag_helm", "Bag Helm", "head", { def: 2 }),
  cup_crown: blueprint("cup_crown", "Cup Crown", "head", { hp: 4 }),
  magazine_mail: blueprint("magazine_mail", "Magazine Mail", "shell", {
    def: 3,
  }),
  cardboard_shell: blueprint("cardboard_shell", "Cardboard Shell", "shell", {
    def: 2,
  }),
  wrapper_vest: blueprint("wrapper_vest", "Wrapper Vest", "shell", { hp: 3 }),
  bottle_blade: blueprint("bottle_blade", "Bottle Blade", "main_claw", {
    atk: 3,
  }),
  straw_spear: blueprint("straw_spear", "Straw Spear", "main_claw", {
    atk: 2,
    spd: 1,
  }),
  can_shield: blueprint("can_shield", "Can Shield", "off_claw", { def: 2 }),
  cap_boots: blueprint("cap_boots", "Cap Boots", "feet", { spd: 2 }),
};
export function gearFor(
  category: Category,
  subtype: "magazine" | null = null,
): GearBlueprint | null {
  if (category === "paper_cardboard" && subtype === "magazine")
    return catalog.magazine_mail;
  const mapping: Record<Category, string | null> = {
    plastic_bottle: "bottle_blade",
    aluminum_can: "can_shield",
    food_wrapper: "wrapper_vest",
    disposable_cup: "cup_crown",
    plastic_bag: "bag_helm",
    bottle_cap: "cap_boots",
    paper_cardboard: "cardboard_shell",
    straw: "straw_spear",
    other_litter: null,
  };
  return mapping[category] ? catalog[mapping[category]!] : null;
}
export type Collectible = {
  catalogId?: string;
  id: string;
  createdAtIso: string;
  category: Category;
  subtype: "magazine" | null;
  label: string;
  rarity: Rarity;
  gearBlueprintId: string | null;
  gearRulesVersion: 1;
  sprite: { thumbnailBlobKey: string; width: number; height: number };
  cleanupClaimedAtIso?: string | null;
};
export type Equipment = Partial<Record<GearSlot, string>>;
export const BASE_STATS: Stats = { hp: 40, atk: 6, def: 4, spd: 4 };
export function equip(
  loadout: Equipment,
  items: Collectible[],
  slot: GearSlot,
  id: string | null,
): Equipment {
  const next = { ...loadout };
  if (id === null) {
    delete next[slot];
    return next;
  }
  const item = items.find((i) => i.id === id);
  if (!item) throw new Error("This item is not in your ShoreDex.");
  const gear = item.gearBlueprintId ? catalog[item.gearBlueprintId] : null;
  if (!gear || gear.slot !== slot)
    throw new Error("This gear does not fit that slot.");
  if (Object.entries(next).some(([s, v]) => s !== slot && v === id))
    throw new Error("This item is already equipped.");
  next[slot] = id;
  return next;
}
export function statsFor(loadout: Equipment, items: Collectible[]): Stats {
  const stats = { ...BASE_STATS };
  const seen = new Set<string>();
  for (const slot of slots) {
    const id = loadout[slot];
    if (!id) continue;
    if (seen.has(id)) throw new Error("Duplicate equipment.");
    seen.add(id);
    equip({}, items, slot, id);
    const item = items.find((i) => i.id === id)!;
    const b = catalog[item.gearBlueprintId!];
    for (const key of Object.keys(b.statBonus) as (keyof Stats)[])
      stats[key] += b.statBonus[key]!;
  }
  return {
    hp: Math.min(60, stats.hp),
    atk: Math.min(15, stats.atk),
    def: Math.min(15, stats.def),
    spd: Math.min(12, stats.spd),
  };
}
