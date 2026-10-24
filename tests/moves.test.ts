import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { openDB, deleteDB } from "idb";
import { BASE_STATS } from "../src/lib/gear";
import {
  moves,
  crabLevel,
  mainAtLevel,
  initialProgression,
  normalizeProgression,
  specialMoves,
  validateMoves,
  type MoveId,
} from "../src/lib/moves";
import {
  createBattle,
  resolveTurn,
  damageFor,
  cpuAction,
  cpuSetup,
  battleXpAward,
  type BattleState,
} from "../src/lib/battle";
import {
  dbPromise,
  saveDiscovery,
  saveEquipment,
  saveMoveSelection,
  readGame,
  recordBattleResult,
  upgradePixelDB,
  type PixelDB,
} from "../src/lib/storage";
const specialBattle = (special: MoveId) =>
  createBattle(BASE_STATS, ["owned"], {
    level: 1,
    blueprints: [moves[special].gear!],
    moves: ["pinch", "guard", special],
  });
function finish(win = true) {
  let battle = createBattle({ ...BASE_STATS, atk: 15 });
  for (let i = 0; i < 100 && battle.status === "active"; i++)
    battle = resolveTurn(
      battle,
      battle.currentActorId!,
      battle.currentActorId === "cpu"
        ? cpuAction(battle)
        : win
          ? "pinch"
          : "guard",
    );
  return battle;
}
describe("independent move eligibility", () => {
  it("unlocks main attacks at exact levels without auto replacing the selection", () => {
    const thresholds = [
      [1, "pinch"],
      [3, "shell_slam"],
      [5, "double_pinch"],
      [8, "tidal_strike"],
      [12, "crushing_claw"],
    ] as const;
    for (const [level, id] of thresholds) {
      expect(mainAtLevel(level)).toContain(id);
      if (level > 1) expect(mainAtLevel(level - 1)).not.toContain(id);
    }
    expect(crabLevel(99)).toBe(1);
    expect(crabLevel(100)).toBe(2);
    expect(
      normalizeProgression({ ...initialProgression(), xp: 1100 }, []).main,
    ).toBe("pinch");
    expect(
      normalizeProgression({ ...initialProgression(), xp: 1100 }, [])
        .unlockedMain,
    ).toHaveLength(5);
  });
  it("uses owned gear independently of level, exactly three slots and permanent Defend", () => {
    expect(specialMoves([])).toEqual(["tidal_slam"]);
    expect(
      specialMoves([
        "bottle_blade",
        "can_shield",
        "bag_helm",
        "magazine_mail",
        "cap_boots",
      ]),
    ).toHaveLength(5);
    expect(() =>
      validateMoves(1, ["bag_helm"], ["pinch", "guard", "bag_snare"]),
    ).not.toThrow();
    expect(() =>
      validateMoves(1, [], ["shell_slam", "guard", "tidal_slam"]),
    ).toThrow();
    expect(() =>
      validateMoves(12, [], ["crushing_claw", "guard", "bag_snare"]),
    ).toThrow();
    expect(() =>
      validateMoves(1, [], [
        "pinch",
        "pinch",
        "tidal_slam",
      ] as unknown as Parameters<typeof validateMoves>[2]),
    ).toThrow();
    expect(
      normalizeProgression(
        {
          ...initialProgression(),
          main: "crushing_claw",
          special: "bottle_slash",
        },
        [],
      ),
    ).toEqual(initialProgression());
  });
  it("rejects unselected moves, retains immutable start snapshots and grows CPU moves", () => {
    const selection = ["pinch", "guard", "bottle_slash"] as const;
    const gear = ["bottle_blade"];
    const b = createBattle(BASE_STATS, ["bottle"], {
      level: 1,
      blueprints: gear,
      moves: selection,
    });
    gear.length = 0;
    expect(b.fighters[0].snapshotBlueprints).toEqual(["bottle_blade"]);
    expect(() => resolveTurn(b, "player", "bag_snare")).toThrow();
    expect(cpuSetup(3).moves[0]).toBe("shell_slam");
    expect(cpuSetup(12).moves[0]).toBe("crushing_claw");
  });
});
describe("special combat effects", () => {
  it("retains direct damage and speed-based calculation", () => {
    expect(damageFor(BASE_STATS, BASE_STATS, "pinch")).toBe(11);
    expect(damageFor(BASE_STATS, BASE_STATS, "bottle_slash")).toBe(20);
    expect(damageFor({ ...BASE_STATS, spd: 6 }, BASE_STATS, "cap_dash")).toBe(
      20,
    );
    expect(damageFor(BASE_STATS, BASE_STATS, "guard")).toBe(0);
  });
  it("applies multi-hit defense per hit and halves the full action once", () => {
    expect(damageFor(BASE_STATS, BASE_STATS, "paper_barrage")).toBe(24);
    expect(damageFor(BASE_STATS, BASE_STATS, "paper_barrage", true)).toBe(12);
    expect(damageFor(BASE_STATS, BASE_STATS, "double_pinch")).toBe(14);
    let b = specialBattle("paper_barrage");
    b = resolveTurn(b, "player", "guard");
    b = resolveTurn(b, "cpu", "guard");
    b = resolveTurn(b, "player", "paper_barrage");
    expect(b.log.at(-1)?.damage).toBe(11); // 3 × (4+6−6/2)=21, halved up
    expect(b.log.at(-1)?.hits).toBe(3);
    expect(b.fighters[1].guarding).toBe(false);
  });
  it("counter halves one attack and retaliates once without recursive counters", () => {
    let b = specialBattle("can_counter");
    b = resolveTurn(b, "player", "can_counter");
    b = resolveTurn(b, "cpu", "pinch");
    expect(b.fighters[0].currentHp).toBe(34);
    expect(b.fighters[1].currentHp).toBe(34);
    expect(b.log.at(-1)?.counterDamage).toBe(6);
    expect(b.fighters[0].counterDamage).toBe(0);
    b = resolveTurn(b, "player", "guard");
    b = resolveTurn(b, "cpu", "pinch");
    expect(b.log.at(-1)?.counterDamage).toBe(0);
  });
  it("Defend replaces a pending counter, and lethal hits do not retaliate", () => {
    let b = specialBattle("can_counter");
    b = resolveTurn(b, "player", "can_counter");
    b = resolveTurn(b, "cpu", "guard");
    b = resolveTurn(b, "player", "guard");
    expect(b.fighters[0].counterDamage).toBe(0);
    b = specialBattle("can_counter");
    b.fighters[0].currentHp = 1;
    b = resolveTurn(b, "player", "can_counter");
    b = resolveTurn(b, "cpu", "pinch");
    expect(b.winnerId).toBe("cpu");
    expect(b.log.at(-1)?.counterDamage).toBe(0);
  });
  it("counter damage can end the match and prevents later actions", () => {
    let b = specialBattle("can_counter");
    b.fighters[1].currentHp = 6;
    b = resolveTurn(b, "player", "can_counter");
    b = resolveTurn(b, "cpu", "pinch");
    expect(b.winnerId).toBe("player");
    expect(b.fighters[1].currentHp).toBe(0);
    expect(() => resolveTurn(b, "player", "pinch")).toThrow();
  });
  it("Bag Snare lasts two enemy turns, does not change base stats, and counts defend turns", () => {
    let b = specialBattle("bag_snare");
    b = resolveTurn(b, "player", "bag_snare");
    expect(b.fighters[1].weakenedTurns).toBe(2);
    b = resolveTurn(b, "cpu", "pinch");
    expect(b.log.at(-1)?.damage).toBe(8);
    expect(b.fighters[1].weakenedTurns).toBe(1);
    expect(b.fighters[1].startingStats.atk).toBe(6);
    b = resolveTurn(b, "player", "guard");
    b = resolveTurn(b, "cpu", "guard");
    expect(b.fighters[1].weakenedTurns).toBe(0);
    expect(b.fighters[1].attackReduction).toBe(0);
  });
  it("special cooldown ticks on own turns only and cannot be bypassed", () => {
    let b = specialBattle("bottle_slash");
    b = resolveTurn(b, "player", "bottle_slash");
    b = resolveTurn(b, "cpu", "guard");
    expect(b.fighters[0].cooldowns.bottle_slash).toBe(2);
    expect(() => resolveTurn(b, "player", "bottle_slash")).toThrow();
    for (let i = 0; i < 2; i++) {
      b = resolveTurn(b, "player", "guard");
      b = resolveTurn(b, "cpu", "guard");
    }
    expect(b.fighters[0].cooldowns.bottle_slash).toBe(0);
    expect(() => resolveTurn(b, "player", "bottle_slash")).not.toThrow();
  });
});
describe("move persistence and battle rewards", () => {
  beforeEach(async () => {
    const db = await dbPromise;
    for (const name of db.objectStoreNames) await db.clear(name);
  });
  const discover = (id: string, category: "plastic_bag" | "aluminum_can") =>
    saveDiscovery({
      id,
      category,
      subtype: null,
      label: id,
      safety: "allowed",
      art: new Blob(["png"], { type: "image/png" }),
    });
  it("preserves discoveries and makes specials eligible only when equipped, with immediate invalidation", async () => {
    await discover("bag", "plastic_bag");
    await discover("can", "aluminum_can");
    expect((await readGame()).progression).toEqual(initialProgression());
    await expect(saveMoveSelection("special", "bag_snare")).rejects.toThrow();
    await saveEquipment("head", "bag");
    await saveEquipment("off_claw", "can");
    await saveMoveSelection("special", "bag_snare");
    expect((await readGame()).progression.special).toBe("bag_snare");
    await saveMoveSelection("special", "can_counter");
    expect((await readGame()).progression.special).toBe("can_counter");
    await saveEquipment("off_claw", null);
    expect((await readGame()).progression.special).toBe("bag_snare");
    await saveEquipment("head", null);
    expect((await readGame()).progression.special).toBe("tidal_slam");
    expect((await readGame()).items).toHaveLength(2);
    expect((await readGame()).claims).toHaveLength(0);
  });
  it("rejects locked main selection, persists unlocked choices and retains them on later unlocks", async () => {
    await expect(saveMoveSelection("main", "shell_slam")).rejects.toThrow();
    await (
      await dbPromise
    ).put("battleProgression", { ...initialProgression(), xp: 200 }, "local");
    await saveMoveSelection("main", "shell_slam");
    expect((await readGame()).progression.main).toBe("shell_slam");
    for (let i = 0; i < 5; i++) await recordBattleResult(finish());
    const game = await readGame();
    expect(game.progression.xp).toBe(400);
    expect(game.progression.main).toBe("shell_slam");
    expect(game.progression.unlockedMain).toContain("double_pinch");
  });
  it("awards wins/losses once transactionally, never discovery or cleanup XP or forfeits", async () => {
    const b = finish();
    expect(b.winnerId).toBe("player");
    await Promise.all([recordBattleResult(b), recordBattleResult(b)]);
    expect((await readGame()).progression.xp).toBe(40);
    const loss = finish(false);
    expect(loss.winnerId).toBe("cpu");
    await recordBattleResult(loss);
    expect((await readGame()).progression.xp).toBe(55);
    expect((await readGame()).claims).toHaveLength(0);
    const quit = {
      ...createBattle(BASE_STATS),
      status: "forfeited",
      currentActorId: null,
    } as BattleState;
    expect(battleXpAward(quit)).toBe(0);
    await expect(recordBattleResult(quit)).rejects.toThrow();
    expect(await (await dbPromise).count("battleRewards")).toBe(2);
  });
  it("upgrades v3 without replacing gear, photos, consent, profile or cleanup", async () => {
    const name = "moves-v3-migration";
    const old = await openDB<PixelDB>(name, 3, {
      upgrade(db) {
        upgradePixelDB(db, 0);
        db.deleteObjectStore("battleProgression");
        db.deleteObjectStore("battleRewards");
      },
    });
    await old.put("loadouts", { head: "existing" }, "local");
    await old.put(
      "preferences",
      { version: 1, analysisConsent: true },
      "privacy",
    );
    await old.put(
      "artBlobs",
      { bytes: new ArrayBuffer(4), type: "image/png" },
      "existing",
    );
    old.close();
    const next = await openDB<PixelDB>(name, 4, { upgrade: upgradePixelDB });
    expect(await next.get("loadouts", "local")).toEqual({ head: "existing" });
    expect((await next.get("preferences", "privacy"))?.analysisConsent).toBe(
      true,
    );
    expect(await next.get("artBlobs", "existing")).toBeDefined();
    expect(next.objectStoreNames.contains("battleProgression")).toBe(true);
    expect(await next.count("battleRewards")).toBe(0);
    next.close();
    await deleteDB(name);
  });
});
