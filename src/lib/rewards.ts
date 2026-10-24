import type { Category, Rarity } from "./gear";
export function cleanupAward(
  category: Category,
  previousCategories: readonly Category[],
): 10 | 15 {
  return previousCategories.includes(category) ? 10 : 15;
}
export function rollRarity(random: number): Rarity {
  return random < 0.6
    ? "common"
    : random < 0.87
      ? "uncommon"
      : random < 0.97
        ? "rare"
        : "legendary";
}
