import { writeFileSync } from "node:fs";
import { shoreCatalog, validateCatalog } from "../src/catalog/index.ts";
import { catalog } from "../src/lib/gear.ts";
import { moves } from "../src/lib/moves.ts";
validateCatalog();
const sql = (value: unknown) =>
  value === null ? "null" : `'${String(value).replaceAll("'", "''")}'`;
const statements = [
  ...Object.values(catalog).map(
    (g) =>
      `insert into public.gear_definitions(id,slot,metadata) values(${sql(g.id)},${sql(g.slot)},${sql(JSON.stringify(g))}::jsonb) on conflict(id) do update set metadata=excluded.metadata;`,
  ),
  ...Object.values(moves).map(
    (m) =>
      `insert into public.move_definitions(id,slot,level_required,gear_id,metadata) values(${sql(m.id)},${sql(m.slot)},${m.level ?? "null"},${sql(m.gear ?? null)},${sql(JSON.stringify(m))}::jsonb) on conflict(id) do update set metadata=excluded.metadata,level_required=excluded.level_required,gear_id=excluded.gear_id;`,
  ),
  ...shoreCatalog.map(
    (c) =>
      `insert into public.collectible_catalog(id,number,name,category,material,rarity,gear_id,metadata) values(${sql(c.id)},${c.number},${sql(c.name)},${sql(c.category)},${sql(c.material)},${sql(c.rarity)},${sql(c.gearId)},${sql(JSON.stringify(c))}::jsonb) on conflict(id) do update set name=excluded.name,category=excluded.category,material=excluded.material,rarity=excluded.rarity,gear_id=excluded.gear_id,metadata=excluded.metadata;`,
  ),
];
writeFileSync(
  "supabase/migrations/202610240002_catalog_seed.sql",
  statements.join("\n") + "\n",
);
console.log(`Seeded SQL definitions: ${shoreCatalog.length} collectibles`);
