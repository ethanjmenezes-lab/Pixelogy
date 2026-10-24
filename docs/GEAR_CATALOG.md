# Trash-to-gear catalog and equipment semantics

## Inventory rule

Each **reviewed safe scan/discovery** creates **one persistent collectible instance** (`collectibleId`), a pixel-art card and at most **one** matching gear blueprint. Item is *not consumed* when equipped. Each instance can occupy only one crab slot; each slot holds at most one instance. Unequip/swap is reversible. A repeated safe scan of the same category creates another discovery instance without passive stacking. Optional **self-reported safe disposal** can be claimed once per instance to earn separate cleanup XP, but is **not** required to equip gear.

### Fixed v4 slots

1. `head` — helmets/hats, on/above eyes.
2. `shell` — body armor, chestplate, cape/shell cover.
3. `main_claw` — sword/spear/blaster/tool in attacking claw.
4. `off_claw` — shields/defensive tools in opposite claw.
5. `feet` — boots, skates or pads on walking legs.

An optional `accessory` slot is a **stretch** and must be excluded from base stat calculation unless fully designed/tested.

## Authoritative category/subtype mappings (initial v4)

The `category` is stable cleanup taxonomy; the optional `subtype` refines it. Assign the **first matching specific subtype**, otherwise default category mapping. Gemini suggests only category/subtype; it **cannot invent names, slots, power or special moves**. Mapping is a pure typed function.

| Safe item / detected subtype | Category key | Blueprint ID | Crab slot | Sprite idea | Stat bonus |
|---|---|---|---|---|---|
| Plastic shopping bag | `plastic_bag` | `bag_helm` | `head` | Puffy tied bag helmet | DEF +2 |
| Disposable paper/plastic cup | `disposable_cup` | `cup_crown` | `head` | Upside-down cup crown | HP +4 |
| Magazine, brochure | `paper_cardboard` + `magazine` | `magazine_mail` | `shell` | Folded glossy magazine carapace | DEF +3 |
| Other cardboard/paper | `paper_cardboard` | `cardboard_shell` | `shell` | Box-panel armor | DEF +2 |
| Food wrapper | `food_wrapper` | `wrapper_vest` | `shell` | Shiny wrapper vest | HP +3 |
| Plastic bottle | `plastic_bottle` | `bottle_blade` | `main_claw` | Blunt plastic bottle sword | ATK +3 |
| Straw | `straw` | `straw_spear` | `main_claw` | Tiny drinking-straw spear | ATK +2, SPD +1 |
| Aluminum can | `aluminum_can` | `can_shield` | `off_claw` | Flattened *stylized* can shield | DEF +2 |
| Bottle cap | `bottle_cap` | `cap_boots` | `feet` | One found cap inspires symmetric cap boots | SPD +2 |
| Intact bottle **only when approved safe to handle** | `other_litter` + `intact_bottle` | `bottle_blade` | `main_claw` | Cartoon *Bottle Blade* like requested; non-sharp sprite | ATK +3 |
| Other safe, classifiable litter | `other_litter` | `litter_charm` | **no equip slot** in MVP | Card in ShoreDex, no uncertain effect | — |

**Glass safety policy:** Never prompt anyone to collect glass to obtain a sword. **Broken, sharp, unidentified or questionably intact glass is hazardous and excluded**. An intact bottle illustration may be shown as a **non-persistent tutorial/demo item**, or awarded only after explicit safe-handling review in an approved educational context. No extra XP or strength for glass vs plastic. If this is complex or risky, implement `bottle_blade` from *plastic bottles only* in the MVP.

### Type model and validation

```ts
type GearSlot = 'head' | 'shell' | 'main_claw' | 'off_claw' | 'feet';
type Stat = 'hp' | 'atk' | 'def' | 'spd';
type Stats = Record<Stat, number>;
type GearBlueprint = {
  id: string;
  label: string;
  slot: GearSlot;
  statBonus: Partial<Stats>;
  assetKey: string;
  rulesVersion: 1;
};
type EquippedLoadout = Partial<Record<GearSlot, string>>; // collectible IDs
```

Gear bonuses are fixed by blueprint ID; cards' rarity never affects them. Persist `gearBlueprintId` and `rulesVersion` on each card so the appearance and mapping are stable across updates. If no valid mapping, leave item ShoreDex-only instead of guessing.

## Example crab builds

**Starter defense:** Bag Helm (head) + Magazine Mail (shell) + Bottle Blade (main claw) + Can Shield (off claw) + Cap Boots (feet). Five *distinct saved safe-discovery items* produce `HP 40, ATK 9, DEF 11, SPD 6` from a `40/6/4/4` base. The crab remains red and visible behind its scavenged armor.

**Quick-strike alternative:** Cup Crown (HP +4) + Wrapper Vest (HP +3) + Straw Spear (ATK +2, SPD +1) + Can Shield (DEF +2) + Cap Boots (SPD +2) → `HP 47, ATK 8, DEF 6, SPD 7`.

## UI behavior

- Categorize owned cards by **eligible slot** with badge labels (Head/Shell/Main Claw/Off Claw/Feet); `other_litter` remains collectible even without equipment.
- Selecting a slot filters inventory to valid gear; selecting an owned gear card may offer `Equip to [slot]`. Wrong-slot attempts return friendly error and **leave loadout unchanged**.
- Show crab live sprite composite and **before/after** stats. Equipping a second item to occupied slot swaps it; previous gear remains owned.
- Gear is non-consumable; wins/losses do not destroy it.
- No generated stats based on item monetary value, danger, amount of physical waste, AI confidence, or cosmetic rarity.
- In online battles, server verifies loadout ownership against the user's server-recorded eligible inventory ownership records (distinct from optional cleanup XP claims); do not trust local save JSON for official PvP strength.
