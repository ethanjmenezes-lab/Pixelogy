import { rollRarity } from "../src/lib/rewards";
import "fake-indexeddb/auto";
import { beforeEach, describe, it, expect } from "vitest";
import {
  BASE_STATS,
  catalog,
  equip,
  gearFor,
  statsFor,
  type Collectible,
} from "../src/lib/gear";
import {
  createBattle,
  resolveTurn,
  damageFor,
  cpuAction,
} from "../src/lib/battle";
import { boxToCrop, validCrop } from "../src/lib/pixel";
import { recognitionSchema, analyzeRequest } from "../src/lib/recognition";
import {
  dbPromise,
  saveDiscovery,
  claimCleanup,
  readGame,
  saveEquipment,
} from "../src/lib/storage";
const item = (
  id: string,
  blueprint: string,
  rarity: Collectible["rarity"] = "common",
): Collectible => ({
  id,
  createdAtIso: "2026-10-24T00:00:00Z",
  category: "plastic_bag",
  subtype: null,
  label: id,
  rarity,
  gearBlueprintId: blueprint,
  gearRulesVersion: 1,
  sprite: { thumbnailBlobKey: id, width: 256, height: 256 },
});
describe("gear rules", () => {
  it("maps the full catalog with subtype precedence and no unknown bonuses", () => {
    expect(gearFor("paper_cardboard", "magazine")?.id).toBe("magazine_mail");
    expect(gearFor("paper_cardboard")?.id).toBe("cardboard_shell");
    expect(gearFor("other_litter")).toBeNull();
    expect(Object.keys(catalog)).toHaveLength(9);
  });
  it("computes the canonical five-item build independent of rarity", () => {
    const items = [
      item("a", "bag_helm"),
      item("b", "magazine_mail"),
      item("c", "bottle_blade"),
      item("d", "can_shield"),
      item("e", "cap_boots"),
    ];
    const equipment = {
      head: "a",
      shell: "b",
      main_claw: "c",
      off_claw: "d",
      feet: "e",
    };
    expect(statsFor(equipment, items)).toEqual({
      hp: 40,
      atk: 9,
      def: 11,
      spd: 6,
    });
    expect(
      statsFor(
        equipment,
        items.map((i) => ({ ...i, rarity: "legendary" })),
      ),
    ).toEqual(statsFor(equipment, items));
  });
  it("rejects wrong slot, unowned and duplicated item without changing state", () => {
    const items = [item("a", "bag_helm")];
    const before = { head: "a" };
    expect(() => equip(before, items, "shell", "a")).toThrow();
    expect(() => equip(before, items, "head", "missing")).toThrow();
    expect(() => statsFor({ head: "a", shell: "a" }, items)).toThrow();
    expect(before).toEqual({ head: "a" });
    expect(equip(before, items, "head", null)).toEqual({});
  });
  it("has exact cosmetic rarity thresholds", () => {
    expect(
      [0, 0.599, 0.6, 0.869, 0.87, 0.969, 0.97, 0.999].map(rollRarity),
    ).toEqual([
      "common",
      "common",
      "uncommon",
      "uncommon",
      "rare",
      "rare",
      "legendary",
      "legendary",
    ]);
  });
});
describe("battle resolver", () => {
  it("uses integer damage and consumes nonstacking guard", () => {
    expect(damageFor(BASE_STATS, BASE_STATS, "pinch")).toBe(11);
    expect(damageFor(BASE_STATS, BASE_STATS, "pinch", true)).toBe(6);
    let b = createBattle(BASE_STATS);
    b = resolveTurn(b, "player", "guard");
    b = resolveTurn(b, "cpu", "guard");
    b = resolveTurn(b, "player", "guard");
    b = resolveTurn(b, "cpu", "pinch");
    expect(b.fighters[0].currentHp).toBe(34);
    expect(b.fighters[0].guarding).toBe(false);
  });
  it("blocks Basic Splash for exactly two own turns, not opponent turns", () => {
    let b = createBattle({ ...BASE_STATS, hp: 60 });
    b = resolveTurn(b, "player", "tidal_slam");
    expect(b.fighters[0].cooldowns.tidal_slam).toBe(2);
    b = resolveTurn(b, "cpu", "guard");
    expect(b.fighters[0].cooldowns.tidal_slam).toBe(2);
    expect(() => resolveTurn(b, "player", "tidal_slam")).toThrow();
    b = resolveTurn(b, "player", "guard");
    b = resolveTurn(b, "cpu", "guard");
    expect(() => resolveTurn(b, "player", "tidal_slam")).toThrow();
    b = resolveTurn(b, "player", "guard");
    b = resolveTurn(b, "cpu", "guard");
    expect(b.fighters[0].cooldowns.tidal_slam).toBe(0);
    expect(() => resolveTurn(b, "player", "tidal_slam")).not.toThrow();
  });
  it("starts by speed with stable ties and rejects wrong actor or illegal action", () => {
    expect(createBattle({ ...BASE_STATS, spd: 3 }).currentActorId).toBe("cpu");
    expect(createBattle(BASE_STATS).currentActorId).toBe("player");
    const b = createBattle(BASE_STATS);
    expect(() => resolveTurn(b, "cpu", "pinch")).toThrow();
    expect(() => resolveTurn(b, "player", "unknown" as "pinch")).toThrow();
    expect(b.version).toBe(0);
  });
  it("finishes a real deterministic match, clamps HP, freezes KO and preserves input", () => {
    let b = createBattle({ ...BASE_STATS, atk: 15 });
    const initial = structuredClone(b);
    for (let n = 0; n < 40 && b.status === "active"; n++)
      b = resolveTurn(
        b,
        b.currentActorId!,
        b.currentActorId === "cpu"
          ? cpuAction(b)
          : b.fighters[0].cooldowns.tidal_slam
            ? "pinch"
            : "tidal_slam",
      );
    expect(b.status).toBe("completed");
    expect(b.winnerId).toBe("player");
    expect(b.fighters[1].currentHp).toBe(0);
    expect(() => resolveTurn(b, "player", "pinch")).toThrow();
    expect(initial.fighters[0].currentHp).toBe(40);
  });
  it("CPU can win when the player only guards", () => {
    let b = createBattle(BASE_STATS);
    for (let n = 0; n < 100 && b.status === "active"; n++)
      b = resolveTurn(
        b,
        b.currentActorId!,
        b.currentActorId === "cpu" ? cpuAction(b) : "guard",
      );
    expect(b.winnerId).toBe("cpu");
  });
});
describe("recognition and crop validation", () => {
  it("uses y/x normalized box order for portrait and landscape", () => {
    const crop = boxToCrop([100, 200, 900, 600]);
    expect(crop).toEqual({ x: 20, y: 10, width: 40, height: 80 });
    expect((1200 * crop.width) / 100).toBe(480);
    expect((800 * crop.height) / 100).toBe(640);
    expect((800 * crop.width) / 100).toBe(320);
    expect((1200 * crop.height) / 100).toBe(960);
  });
  it("rejects inverted, zero, nonfinite and out of bounds crops", () => {
    for (const box of [
      [0, 0, 0, 0],
      [900, 0, 100, 200],
      [0, 0, 1001, 900],
      [0, NaN, 200, 400],
    ])
      expect(() => boxToCrop(box)).toThrow();
    expect(validCrop({ x: 90, y: 0, width: 20, height: 50 })).toBe(false);
  });
  it("rejects invalid schema and requires explicit upload consent", () => {
    const valid = {
      category: "plastic_bag",
      subtype: null,
      label: "Bag",
      safety: "allowed",
      bbox: [100, 100, 900, 900],
    };
    expect(recognitionSchema.safeParse(valid).success).toBe(true);
    expect(
      recognitionSchema.safeParse({ ...valid, category: "battery" }).success,
    ).toBe(false);
    expect(
      recognitionSchema.safeParse({ ...valid, subtype: "magazine" }).success,
    ).toBe(false);
    expect(
      recognitionSchema.safeParse({ ...valid, polygon: [[1, 2]] }).success,
    ).toBe(false);
    expect(
      analyzeRequest.safeParse({
        consent: false,
        image: "data:image/jpeg;base64,YQ==",
      }).success,
    ).toBe(false);
  });
});
describe("atomic local persistence", () => {
  beforeEach(async () => {
    const db = await dbPromise;
    for (const store of db.objectStoreNames) await db.clear(store);
  });
  const save = (
    id: string,
    category: "plastic_bag" | "bottle_cap" = "plastic_bag",
  ) =>
    saveDiscovery({
      id,
      category,
      subtype: null,
      label: category,
      safety: "allowed",
      art: new Blob(["pixel"], { type: "image/png" }),
    });
  it("saves one discovery on concurrent retry, preserves rarity, no scan XP", async () => {
    const [a, b] = await Promise.all([save("a"), save("a")]);
    expect(a.rarity).toBe(b.rarity);
    const game = await readGame();
    expect(game.items).toHaveLength(1);
    expect(game.claims).toHaveLength(0);
    expect(await (await dbPromise).count("discoveryEvents")).toBe(1);
  });
  it("awards one cleanup per collectible and one first-category bonus under concurrent claims", async () => {
    await save("a");
    await save("b");
    await save("c", "bottle_cap");
    const results = await Promise.all([
      claimCleanup("a", "e1"),
      claimCleanup("a", "e2"),
      claimCleanup("b", "e3"),
      claimCleanup("c", "e4"),
    ]);
    expect(results[0].eventId).toBe(results[1].eventId);
    const game = await readGame();
    expect(game.claims).toHaveLength(3);
    expect(game.claims.reduce((s, c) => s + c.xpAwarded, 0)).toBe(40);
    expect(game.items.every((i) => !!i.cleanupClaimedAtIso)).toBe(true);
  });
  it("does not reuse event IDs or award phantom cleanup for nonexistent items", async () => {
    await save("a");
    await save("b");
    await claimCleanup("a", "e1");
    await expect(claimCleanup("b", "e1")).rejects.toThrow();
    await expect(claimCleanup("missing", "e2")).rejects.toThrow();
    expect((await readGame()).claims).toHaveLength(1);
  });
  it("rejects unsafe discovery and persists/repairs loadouts", async () => {
    await expect(
      saveDiscovery({
        id: "bad",
        category: "other_litter",
        subtype: null,
        label: "Glass",
        safety: "hazardous",
        art: new Blob(["x"], { type: "image/png" }),
      }),
    ).rejects.toThrow();
    await save("a");
    await saveEquipment("head", "a");
    expect((await readGame()).loadout).toEqual({ head: "a" });
    await expect(saveEquipment("feet", "a")).rejects.toThrow();
    await (await dbPromise).delete("collectibles", "a");
    const repaired = await readGame();
    expect(repaired.loadout).toEqual({});
    expect(repaired.repaired).toBe(true);
  });
});
