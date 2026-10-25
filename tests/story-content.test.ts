import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { script, scenes, narrativeStrings } from "../src/story/script";
import { stages, stageById } from "../src/story/campaign";
it("preserves unchanged regions and snapshots the explicitly revised opening", () => {
  const original = readFileSync("STORY_SCRIPT.json"),
    runtime = readFileSync("src/content/story-script.json");
  const previous = JSON.parse(original.toString());
  expect(script.regions).toEqual(previous.regions);
  expect(script.encounters).toEqual(previous.encounters);
  expect(script.ending).toEqual(previous.ending);
  expect(createHash("sha256").update(runtime).digest("hex")).toMatchSnapshot();
  expect(narrativeStrings(script)).toMatchSnapshot();
  expect(script.version).toBe("locked-dialogue-2.0-baby-crab");
});
it("has five regions, 25 exact encounters, seven opening shots and six ending shots", () => {
  expect(script.regions).toHaveLength(5);
  expect(stages).toHaveLength(25);
  expect(script.opening.shots).toHaveLength(7);
  expect(script.ending.shots).toHaveLength(6);
  expect(stages.filter((s) => s.boss)).toHaveLength(5);
  expect(new Set(script.encounters.map((e) => e.id)).size).toBe(25);
  const shots = scenes.flatMap((s) => s.shots);
  expect(new Set(shots.map((s) => s.id)).size).toBe(shots.length);
  script.encounters.forEach((e, i) => {
    expect(stages[i].contentId).toBe(e.id);
    expect(stages[i].name).toBe(e.stage_name);
    expect(stages[i].trainer.nickname).toBe(e.trainer);
    expect(stages[i].introLines).toEqual(e.intro_exact);
    expect(stages[i].defeatLines).toEqual(e.defeat_exact);
    expect(stageById(e.id)).toBe(stages[i]);
    expect(stageById(stages[i].id)).toBe(stages[i]); // old save and deep link alias
  });
});

it("attributes the opening observation to the exact requested caption", () => {
  expect(script.opening.shots[1].dialogue_exact).toEqual([
    { speaker: "CAPTION", text: "Something isn't right." },
  ]);
});
