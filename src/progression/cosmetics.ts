import type { Profile } from "../world/profile";
export const cosmetics: {
  id: string;
  name: string;
  level: number;
  patch: Partial<Profile>;
}[] = [
  {
    id: "coral",
    name: "Coral shirt",
    level: 1,
    patch: { clothing: 0, outfit: "plain" },
  },
  { id: "lagoon", name: "Lagoon shirt", level: 2, patch: { clothing: 4 } },
  { id: "sunshine", name: "Sunshine shirt", level: 2, patch: { clothing: 5 } },
  { id: "bun", name: "Coastal bun", level: 3, patch: { hairStyle: "bun" } },
  { id: "beach", name: "Wave shirt", level: 5, patch: { outfit: "beach" } },
  {
    id: "glasses",
    name: "Sunset shades",
    level: 8,
    patch: { accessory: "sunglasses" },
  },
  {
    id: "explorer",
    name: "Explorer vest",
    level: 10,
    patch: { outfit: "explorer" },
  },
];
export const cosmeticUnlocks = (level: number) =>
  cosmetics.filter((c) => c.level <= level);
export function appearanceUnlocked(profile: Profile, level: number) {
  return cosmetics
    .filter((c) => c.level > level)
    .every(
      (c) =>
        !Object.entries(c.patch).every(
          ([key, value]) => profile[key as keyof Profile] === value,
        ),
    );
}
