import { script, type StoryScene } from "../../src/story/script";
import { test, expect, type Page } from "@playwright/test";
import { mockAccount } from "./cloudFixture";
import {
  createBattle,
  resolveTurn,
  type BattleState,
} from "../../src/lib/battle";
import { BASE_STATS } from "../../src/lib/gear";
import {
  stages,
  stageById,
  storyBattle,
  storyCpu,
  storyStars,
  type StoryProgress,
  regionDefinitions,
} from "../../src/story/campaign";
import { crabLevel, mainAtLevel } from "../../src/lib/moves";
async function fixture(
  page: Page,
  finished: boolean | number = false,
  legacy = false,
) {
  const account = await mockAccount(page);
  const progress: StoryProgress[] = finished
    ? stages
        .slice(0, finished === true ? 25 : finished)
        .map((s) => ({ stage_id: s.id, best_stars: 2 }))
    : [];
  account.xp = stages
    .filter((s) => progress.some((p) => p.stage_id === s.id))
    .reduce((n, s) => n + s.xp, 0);
  const watched: string[] = legacy
    ? ["opening"]
    : [script.regions[0].intro_scene.id];
  await page.route("**/rest/v1/selected_moves*", (route) =>
    route.fulfill({
      json: [
        {
          main: mainAtLevel(crabLevel(account.xp)).at(-1),
          special: "tidal_slam",
        },
      ],
    }),
  );
  await page.route("**/rest/v1/story_progress*", (route) =>
    route.fulfill({ json: progress }),
  );
  await page.route("**/rest/v1/story_cinematics*", (route) =>
    route.fulfill({ json: watched.map((cinematic_id) => ({ cinematic_id })) }),
  );
  await page.route("**/rest/v1/rpc/watch_story", (route) => {
    watched.push(route.request().postDataJSON().cinematic);
    return route.fulfill({ json: null });
  });
  const matches = new Map<string, BattleState>();
  let starts = 0;
  await page.route("**/api/story", (route) => {
    const b = route.request().postDataJSON();
    let state: BattleState;
    if (b.action === "start") {
      starts++;
      const stage = stageById(b.stageId)!;
      state = storyBattle(
        createBattle(BASE_STATS, [], {
          level: crabLevel(account.xp),
          blueprints: [],
          moves: [
            mainAtLevel(crabLevel(account.xp)).at(-1)!,
            "guard",
            "tidal_slam",
          ],
        }),
        stage,
      );
      state.id = b.requestId;
    } else {
      state = matches.get(b.matchId)!;
      if (state.version !== b.version || state.status !== "active")
        return route.fulfill({ json: state });
      state =
        b.action === "quit"
          ? {
              ...state,
              status: "forfeited",
              currentActorId: null,
              version: state.version + 1,
            }
          : resolveTurn(state, "player", b.move);
    }
    const stage = stageById(state.storyStageId!)!;
    if (state.status === "active" && state.currentActorId === "cpu")
      state = resolveTurn(state, "cpu", storyCpu(state, stage));
    if (state.status === "completed" && state.winnerId === "player") {
      const old = progress.find((p) => p.stage_id === stage.id);
      if (old)
        old.best_stars = Math.max(old.best_stars, storyStars(state, stage));
      else {
        progress.push({
          stage_id: stage.id,
          best_stars: storyStars(state, stage),
        });
        account.xp += stage.xp;
      }
    }
    matches.set(state.id, state);
    return route.fulfill({ json: state });
  });
  return { progress, watched, account, starts: () => starts };
}
async function win(page: Page) {
  for (let turn = 0; turn < 30; turn++) {
    const scene = page.locator(".battle-scene");
    await expect(scene).toHaveAttribute("data-phase", "ready", {
      timeout: 15000,
    });
    const done = page.getByRole("button", {
      name: "Continue",
      exact: true,
    });
    if (await done.count()) return;
    const slam = page.locator(".arena-move.tidal_slam"),
      pinch = page.locator(".arena-move.pinch");
    if (await slam.isEnabled()) await slam.click();
    else if (await pinch.isEnabled()) await pinch.click();
    else {
      await page.waitForTimeout(100);
      continue;
    }
    await expect(scene).not.toHaveAttribute("data-phase", "ready");
  }
  throw new Error("Stage did not finish");
}
test("Shellshore complete: intro, four trainers, boss, stars, XP, replay and reload", async ({
  page,
}) => {
  test.setTimeout(240000);
  const f = await fixture(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Open crab menu" }).click();
  await page.getByRole("link", { name: "Story Mode Adventure" }).click();
  await page
    .getByRole("button", { name: "Watch Opening", exact: true })
    .click();
  await expect(
    page.getByRole("region", { name: "Story cinematic" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await expect.poll(() => f.watched.includes(script.opening.id)).toBe(true);
  await page.goto("/story?region=shellshore");
  await page.screenshot({ path: test.info().outputPath("shellshore-map.png") });
  await expect(page.locator(".story-node.boss")).toBeDisabled();
  for (let i = 0; i < 5; i++) {
    await page.locator(".story-node").nth(i).click();
    await expect(
      page.getByRole("heading", { name: stages[i].name }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Start Battle", exact: true })
      .click();
    await expect(page.locator(".cpu-trainer")).toHaveAttribute(
      "aria-label",
      `${stages[i].trainer.nickname}, CPU trainer`,
    );
    if (i === 0)
      await page.screenshot({
        path: test.info().outputPath("story-arena.png"),
      });
    await win(page);
    await expect(
      page.getByRole("status").filter({ hasText: "Victory saved" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    if (i === 4)
      await page.getByRole("button", { name: "Skip", exact: true }).click();
  }
  expect(f.account.xp).toBe(240);
  expect(f.account.claims).toHaveLength(0);
  await expect(page.getByText("Shellshore Sunburst unlocked")).toBeVisible();
  await expect(
    page.locator(".region-1").getByText("Open investigation"),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".story-progress")).toContainText("5/5 wins");
  await page.locator(".story-node").first().click();
  await page.getByRole("button", { name: "Start Battle", exact: true }).click();
  await win(page);
  expect(f.account.xp).toBe(240);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByText("Cutscenes & star challenges", { exact: true }).click();
  await page.getByRole("button", { name: "Replay opening" }).click();
  await expect(
    page.getByRole("region", { name: "Story cinematic" }),
  ).toBeVisible();
});
test("deep-link boss lock, workshop return and phone layouts", async ({
  page,
}, info) => {
  await fixture(page);
  await page.goto("/story?stage=shellshore-5");
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await expect(
    page.getByText("Locked · Clear the previous region and four trainers."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start Battle", exact: true }),
  ).toHaveCount(0);
  await page.goto("/story?stage=shellshore-1");
  await page.getByRole("link", { name: "Change Attacks", exact: true }).click();
  await page
    .getByRole("link", { name: "Return to Matchup", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: stages[0].name }),
  ).toBeVisible();
  for (const [width, height] of [
    [375, 812],
    [390, 844],
    [430, 932],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/story?region=shellshore");
    await expect(page.locator(".story-node").first()).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    await page.screenshot({
      path: info.outputPath(`story-${width}.png`),
      animations: "disabled",
    });
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.getByText("Cutscenes & star challenges", { exact: true }).click();
  await page.getByRole("button", { name: "Replay opening" }).click();
  await expect(
    page.getByRole("heading", { name: script.opening.title, exact: true }),
  ).toBeFocused();
  await page.screenshot({
    path: info.outputPath("opening-landscape.png"),
    animations: "disabled",
  });
  await expect(page.locator(".story-cutscene")).toHaveAttribute(
    "data-reduced",
    "true",
  );
});

test("network failure can retry; duplicate start taps and quitting do not grant rewards", async ({
  page,
}) => {
  const f = await fixture(page);
  await page.goto("/story?stage=shellshore-1");
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await page.route(
    "**/api/story",
    async (route) => {
      await route.fulfill({
        status: 503,
        json: { error: "Story temporarily unavailable" },
      });
    },
    { times: 1 },
  );
  await page.getByRole("button", { name: "Start Battle", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Story temporarily unavailable",
  );
  await page
    .getByRole("button", { name: "Start Battle", exact: true })
    .dblclick();
  await expect(page.locator(".battle-scene")).toBeVisible();
  expect(f.starts()).toBe(1);
  await page.getByRole("button", { name: "Exit Stage", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Stage ended." }),
  ).toBeVisible();
  expect(f.progress).toHaveLength(0);
  expect(f.account.xp).toBe(0);
  await page.getByRole("link", { name: "Back to world", exact: true }).click();
  await expect(page.locator(".battle-scene")).toHaveCount(0);
});

test("legacy saves persist; all seven opening shots render exact content and finish at Region 1", async ({
  page,
}, info) => {
  const f = await fixture(page, 5, true);
  await page.goto("/story?region=shellshore");
  await expect(page.locator(".story-cutscene")).toHaveAttribute(
    "data-cinematic",
    script.opening.id,
  );
  for (const shot of script.opening.shots) {
    await expect(page.locator(".story-cutscene")).toHaveAttribute(
      "data-shot",
      shot.id,
    );
    if (shot.overlay_exact)
      await expect(page.locator(".shot-overlay")).toHaveText(
        shot.overlay_exact,
      );
    await page.getByRole("button", { name: "Pause", exact: true }).click();
    if (shot.dialogue_exact?.length) {
      // Continue first reveals a caption if paused before its action lead-in.
      if (!(await page.locator(".shot-caption p").count()))
        await page.getByRole("button", { name: "Next", exact: true }).click();
      for (const line of shot.dialogue_exact) {
        await expect(page.locator(".shot-caption p")).toHaveText(line.text);
        await expect(page.locator(".shot-caption b")).toHaveText(line.speaker);
        await page.screenshot({ path: info.outputPath(shot.id + ".png") });
        await page.getByRole("button", { name: "Next", exact: true }).click();
      }
    } else {
      await page.screenshot({ path: info.outputPath(shot.id + ".png") });
      await page.getByRole("button", { name: "Next", exact: true }).click();
    }
    if (shot.id !== "baby.07")
      await page.getByRole("button", { name: "Resume", exact: true }).click();
  }
  await expect.poll(() => f.watched.includes(script.opening.id)).toBe(true);
  await page.reload();
  await expect(page.locator(".story-cutscene")).toHaveAttribute(
    "data-cinematic",
    script.regions[0].intro_scene.id,
  );
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await expect(page.locator(".story-progress")).toContainText("5/5 wins");
  expect(f.account.xp).toBe(240);
  expect(f.watched).toContain("opening");
  await expect.poll(() => f.watched.includes(script.opening.id)).toBe(true);
  await page.reload();
  await expect(page.locator(".story-node")).toHaveCount(5);
  await expect(page.locator(".story-cutscene")).toHaveCount(0);
});

for (let r = 1; r < 5; r++)
  test(`${regionDefinitions[r].name}: boss, evidence, restoration and next route`, async ({
    page,
  }, info) => {
    test.setTimeout(90000);
    const f = await fixture(page, r * 5 + 4);
    await page.goto(`/story?region=${regionDefinitions[r].id}`);
    await page.getByRole("button", { name: "Skip", exact: true }).click();
    await expect.poll(() => f.watched.includes(script.opening.id)).toBe(true);
    await page.reload();
    await expect(page.locator(".story-cutscene")).toHaveAttribute(
      "data-cinematic",
      script.regions[r].intro_scene.id,
    );
    await page.getByRole("button", { name: "Skip", exact: true }).click();
    await expect
      .poll(() => f.watched.includes(script.regions[r].intro_scene.id))
      .toBe(true);
    await page.goto(`/story?stage=${regionDefinitions[r].id}-5`);
    await page
      .getByRole("button", { name: "Start Battle", exact: true })
      .click();
    await expect(
      page.locator(`.battle-stage [data-region-art="${r}"]`),
    ).toBeVisible();
    await page.screenshot({
      path: info.outputPath(`region-${r}-arena.png`),
      animations: "disabled",
    });
    await win(page);
    await expect(
      page.getByRole("status").filter({ hasText: "Victory saved" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page.locator(".story-cutscene")).toHaveAttribute(
      "data-cinematic",
      script.regions[r].outro_scene.id,
    );
    await page.getByRole("button", { name: "Skip", exact: true }).click();
    if (r === 4) {
      await expect(page.locator(".story-cutscene")).toHaveAttribute(
        "data-cinematic",
        script.ending.id,
      );
      await page.getByRole("button", { name: "Skip", exact: true }).click();
    }
    await expect(
      page.getByRole("region", { name: "Evidence against Blacktide" }),
    ).toContainText(regionDefinitions[r].evidence);
    await expect(page.locator(`[data-region-art="${r}"]`)).toHaveAttribute(
      "data-restored",
      "true",
    );
    expect(f.account.xp).toBe((r + 1) * 240);
    expect(f.account.claims).toHaveLength(0);
    if (r < 4) await expect(page.locator(`.region-${r + 1}`)).toBeEnabled();
    else
      await expect(
        page.getByText("Case exposed · coastline restoration underway"),
      ).toBeVisible();
    await page.reload();
    await expect(page.locator(".story-progress")).toContainText("5/5 wins");
  });

test("later region and boss deep links cannot bypass prerequisites", async ({
  page,
}) => {
  await fixture(page);
  await page.goto("/story?stage=headquarters-5");
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await expect(
    page.getByText("Locked · Clear the previous region and four trainers."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start Battle", exact: true }),
  ).toHaveCount(0);
  await page.goto("/story?region=headquarters");
  await expect(page.locator(".story-node:disabled")).toHaveCount(5);
});

test("every regional shot and ending uses exact sequential dialogue, current gear and pauseable motion", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const f = await fixture(page, true);
  f.watched.push(script.opening.id);
  f.account.discoveries.push({
    id: "22222222-2222-4222-8222-222222222222",
    catalog_id: "grocery-bag",
    discovered_at: new Date().toISOString(),
  });
  f.account.equipment.push({
    slot: "head",
    discovery_id: "22222222-2222-4222-8222-222222222222",
  });
  async function play(scene: StoryScene) {
    for (const shot of scene.shots) {
      await expect(page.locator(".story-cutscene")).toHaveAttribute(
        "data-shot",
        shot.id,
      );
      await page.getByRole("button", { name: "Pause", exact: true }).click();
      const before = await page
        .locator(".story-cutscene")
        .getAttribute("data-elapsed");
      await page.waitForTimeout(100);
      expect(
        await page.locator(".story-cutscene").getAttribute("data-elapsed"),
      ).toBe(before);
      if (shot.overlay_exact)
        await expect(page.locator(".shot-overlay")).toHaveText(
          shot.overlay_exact,
        );
      await expect(page.locator('[data-actor="companion"]')).toHaveAttribute(
        "data-gear",
        "bag_helm",
      );
      if (shot.dialogue_exact?.length) {
        if (!(await page.locator(".shot-caption p").count()))
          await page
            .getByRole("button", { name: "Continue", exact: true })
            .click();
        for (const line of shot.dialogue_exact) {
          await expect(page.locator(".shot-caption p")).toHaveText(line.text);
          await expect(page.locator(".shot-caption b")).toHaveText(
            line.speaker,
          );
          await page
            .getByRole("button", { name: "Continue", exact: true })
            .click();
        }
      } else
        await page
          .getByRole("button", { name: "Continue", exact: true })
          .click();
      if (shot !== scene.shots.at(-1))
        await page.getByRole("button", { name: "Resume", exact: true }).click();
    }
  }
  for (let r = 0; r < 5; r++) {
    await page.goto("/story?region=" + regionDefinitions[r].id);
    if (r === 0) {
      await page
        .getByText("Cutscenes & star challenges", { exact: true })
        .click();
      await page
        .getByRole("button", { name: "Region briefing", exact: true })
        .click();
    }
    await play(script.regions[r].intro_scene);
    await page
      .getByText("Cutscenes & star challenges", { exact: true })
      .click();
    await page
      .getByRole("button", { name: "Replay restoration", exact: true })
      .click();
    await play(script.regions[r].outro_scene);
    if (r === 4) await play(script.ending);
  }
  // Motion is measurable, then freezes when hidden; no battle progresses.
  await page.goto("/story?region=shellshore");
  await page.getByText("Cutscenes & star challenges", { exact: true }).click();
  await page
    .getByRole("button", { name: "Replay opening", exact: true })
    .click();
  const initial = await page
    .locator("canvas")
    .last()
    .evaluate((e: HTMLCanvasElement) => e.toDataURL());
  await page.waitForTimeout(900);
  expect(
    await page
      .locator("canvas")
      .last()
      .evaluate((e: HTMLCanvasElement) => e.toDataURL()),
  ).not.toBe(initial);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".story-cutscene")).toHaveAttribute(
    "data-paused",
    "true",
  );
  const paused = await page
    .locator(".story-cutscene")
    .getAttribute("data-elapsed");
  await page.waitForTimeout(200);
  expect(
    await page.locator(".story-cutscene").getAttribute("data-elapsed"),
  ).toBe(paused);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.locator(".story-cutscene")).toHaveAttribute(
    "data-paused",
    "false",
  );
  for (const width of [375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    const buttons = await page.locator(".cutscene-controls").boundingBox();
    expect(buttons!.y + buttons!.height).toBeLessThanOrEqual(844);
    await page.screenshot({
      path: info.outputPath("cinematic-" + width + ".png"),
    });
  }
  expect(f.account.claims).toHaveLength(0);
});

test("baby crab landing, exact opening, mobile wrapping and automatic first battle", async ({
  page,
}, info) => {
  test.setTimeout(120000);
  const f = await fixture(page);
  for (const [width, height] of [
    [375, 812],
    [390, 844],
    [430, 932],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto("/story");
    await expect(page.locator(".story-landing")).toBeVisible();
    await expect(
      page.getByText("Investigate Blacktide. Save the coast.", { exact: true }),
    ).toBeVisible();
    await expect(page.locator(".story-node")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Start Story", exact: true }),
    ).toBeEnabled();
    await page.screenshot({ path: info.outputPath(`landing-${width}.png`) });
    expect(
      await page
        .locator(".story-screen")
        .evaluate((e) => e.scrollWidth <= e.clientWidth),
    ).toBe(true);
    await page
      .getByRole("button", { name: "Watch Opening", exact: true })
      .click();
    for (const shot of script.opening.shots) {
      await expect(page.locator(".story-cutscene")).toHaveAttribute(
        "data-shot",
        shot.id,
      );
      await page.getByRole("button", { name: "Pause", exact: true }).click();
      if (shot.id === "baby.04") {
        await expect(page.locator('[data-actor="companion"]')).toHaveCount(1);
        await expect(page.locator('[data-actor="worker"]')).toHaveCount(0);
      }
      if (shot.id === "baby.06")
        await expect(page.locator('[data-actor="worker"]')).toHaveCount(1);
      if (shot.dialogue_exact?.length) {
        if (!(await page.locator(".shot-caption p").count()))
          await page.getByRole("button", { name: "Next", exact: true }).click();
        for (const line of shot.dialogue_exact) {
          await expect(page.locator(".shot-caption p")).toHaveText(line.text);
          await expect(page.locator(".shot-caption b")).toHaveText(
            line.speaker,
          );
          expect(
            await page
              .locator(".shot-caption")
              .evaluate((e) => e.scrollWidth <= e.clientWidth),
          ).toBe(true);
          expect(
            await page
              .locator(".story-cutscene")
              .evaluate((e) => e.scrollWidth <= e.clientWidth),
          ).toBe(true);
          if (shot.id === "baby.06")
            await page.screenshot({
              path: info.outputPath(`dialogue-${width}.png`),
            });
          await page.getByRole("button", { name: "Next", exact: true }).click();
        }
      } else
        await page.getByRole("button", { name: "Next", exact: true }).click();
      if (shot !== script.opening.shots.at(-1))
        await page.getByRole("button", { name: "Resume", exact: true }).click();
    }
    await expect(page.locator(".story-landing")).toBeVisible();
  }
  await expect.poll(() => f.watched.includes(script.opening.id)).toBe(true);
  await page.reload();
  await expect(page.locator(".story-cutscene")).toHaveCount(0);
  // Simulate a stale server watch record and a delayed preference save.
  f.watched.splice(
    0,
    f.watched.length,
    ...f.watched.filter((id) => id !== script.opening.id),
  );
  await page.route("**/rest/v1/rpc/watch_story", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    f.watched.push(route.request().postDataJSON().cinematic);
    await route.fulfill({ json: null });
  });
  await page.getByRole("button", { name: "Start Story", exact: true }).click();
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await expect(page.locator(".battle-scene")).toBeVisible();
  await expect.poll(() => f.watched.includes(script.opening.id)).toBe(true);
  await expect(page.locator(".story-cutscene")).toHaveCount(0);
  expect(f.starts()).toBe(1);
  expect(f.account.xp).toBe(0);
  await page.reload();
  await expect(page.locator(".story-stage-preview")).toBeVisible();
  expect(f.starts()).toBe(1);
});
