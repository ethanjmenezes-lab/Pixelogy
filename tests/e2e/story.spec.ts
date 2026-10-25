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
  STORY_TITLE,
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
  const watched: string[] = legacy ? ["opening"] : [];
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
      name: "Continue story",
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
  await expect(
    page.getByRole("region", { name: "Story cinematic" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Skip cinematic" }).click();
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
    if (i === 4)
      await page.getByRole("button", { name: "Skip cinematic" }).click();
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
    await page
      .getByRole("button", { name: "Continue story", exact: true })
      .click();
    if (i === 4)
      await page.getByRole("button", { name: "Skip cinematic" }).click();
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
  await page
    .getByRole("button", { name: "Continue story", exact: true })
    .click();
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
  await page.getByRole("button", { name: "Skip cinematic" }).click();
  await expect(
    page.getByText("Defeat all four trainers to unlock Foreman Sandy."),
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
    await page.goto("/story");
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
    page.getByRole("heading", { name: STORY_TITLE, exact: true }),
  ).toBeFocused();
  await page.screenshot({
    path: info.outputPath("opening-landscape.png"),
    animations: "disabled",
  });
  expect(
    await page
      .locator(".cinema-land")
      .evaluate((e) => getComputedStyle(e).animationName),
  ).toBe("none");
});

test("network failure can retry; duplicate start taps and quitting do not grant rewards", async ({
  page,
}) => {
  const f = await fixture(page);
  await page.goto("/story?stage=shellshore-1");
  await page.getByRole("button", { name: "Skip cinematic" }).click();
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

test("legacy progress survives and the revised animated opening plays once", async ({
  page,
}, info) => {
  const f = await fixture(page, 5, true);
  await page.goto("/story");
  await expect(
    page.locator('[data-cinematic="conspiracy-opening"]'),
  ).toBeVisible();
  await expect(page.locator(".story-caption")).toContainText(
    "Blacktide Industries",
  );
  await page.screenshot({
    path: info.outputPath("corporate-ad.png"),
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Next scene" }).click();
  await expect(page.locator(".dump-truck")).toBeVisible();
  await expect(page.locator(".dumped-package")).toHaveCount(5);
  await page.screenshot({
    path: info.outputPath("night-dumping.png"),
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Next scene" }).click();
  await page.getByRole("button", { name: "Next scene" }).click();
  await expect(page.locator(".cinema-crab")).toBeVisible();
  await expect(page.locator(".cinema-rival .corporate-badge")).toBeVisible();
  await page.getByRole("button", { name: "Skip cinematic" }).click();
  await expect(page.locator(".story-progress")).toContainText("5/5 wins");
  await expect(
    page.getByRole("region", { name: "Evidence against Blacktide" }),
  ).toContainText("Night-shift manifest");
  expect(f.account.xp).toBe(240);
  expect(f.watched).toContain("opening");
  await expect.poll(() => f.watched.includes("conspiracy-opening")).toBe(true);
  await page.reload();
  await expect(page.locator(".story-node")).toHaveCount(5);
  await expect(page.locator(".story-cinema")).toHaveCount(0);
  await expect(page.locator('[data-region-art="0"]')).toHaveAttribute(
    "data-restored",
    "true",
  );
});

for (let r = 1; r < 5; r++)
  test(`${regionDefinitions[r].name}: boss, evidence, restoration and next route`, async ({
    page,
  }, info) => {
    test.setTimeout(90000);
    const f = await fixture(page, r * 5 + 4);
    await page.goto(`/story?stage=${regionDefinitions[r].id}-5`);
    await page.getByRole("button", { name: "Skip cinematic" }).click();
    await page
      .getByRole("button", { name: "Start Battle", exact: true })
      .click();
    await expect(page.locator(".story-caption")).toContainText(
      stages[r * 5 + 4].intro,
    );
    await page.getByRole("button", { name: "Skip cinematic" }).click();
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
    await page
      .getByRole("button", { name: "Continue story", exact: true })
      .click();
    await expect(page.locator(".story-caption")).toContainText(
      r === 4 ? "Vale ordered the dumping" : regionDefinitions[r].evidence,
    );
    if (r === 4) {
      await page.getByRole("button", { name: "Next scene" }).click();
      await page.getByRole("button", { name: "Next scene" }).click();
      await expect(page.locator("[data-island-clean=true]")).toHaveCount(5);
    }
    await page.getByRole("button", { name: "Skip cinematic" }).click();
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
  await page.getByRole("button", { name: "Skip cinematic" }).click();
  await expect(
    page.getByText("Clear the previous region to enter this stage."),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start Battle", exact: true }),
  ).toHaveCount(0);
  await page.goto("/story?region=headquarters");
  await expect(page.locator(".story-node:disabled")).toHaveCount(5);
});
