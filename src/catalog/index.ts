import data from "./catalog.json" with { type: "json" };
import { catalog as gear, type Category, type Rarity } from "../lib/gear.js";
export type CatalogEntry = {
  id: string;
  number: number;
  name: string;
  category: string;
  subtype: string;
  material: string;
  aliases: string[];
  rarity: Rarity;
  description: string;
  gearCategory: Category;
  gearId: string | null;
  sprite: string;
  spriteStatus: "finished" | "draft";
};
export const shoreCatalog = data as CatalogEntry[];
export const catalogById = Object.fromEntries(
  shoreCatalog.map((item) => [item.id, item]),
) as Record<string, CatalogEntry>;
export function validateCatalog() {
  if (
    shoreCatalog.length < 200 ||
    new Set(shoreCatalog.map((i) => i.id)).size !== shoreCatalog.length ||
    new Set(shoreCatalog.map((i) => i.number)).size !== shoreCatalog.length
  )
    throw new Error("Invalid catalog identity");
  for (const item of shoreCatalog)
    if (
      !item.name ||
      !item.material ||
      !item.aliases.length ||
      !["finished", "draft"].includes(item.spriteStatus) ||
      (item.gearId && !gear[item.gearId])
    )
      throw new Error(`Invalid catalog metadata: ${item.id}`);
}
