import { dbPromise, readGame } from "../lib/storage";
import {
  createBattle,
  resolveTurn,
  type BattleAction,
  type BattleState,
} from "../lib/battle";
import { statsFor } from "../lib/gear";
import { crabLevel, normalizeProgression, ownedBlueprints } from "../lib/moves";
import {
  stageById,
  storyBattle,
  storyCpu,
  storyStars,
  unlocked,
  type StoryProgress,
} from "../story/campaign";
export type GuestStory = { progress: StoryProgress[]; watched: string[] };
export async function readGuestStory(): Promise<GuestStory> {
  return (
    ((await (await dbPromise).get("guest", "story")) as GuestStory) ?? {
      progress: [],
      watched: [],
    }
  );
}
export async function watchGuestStory(id: string) {
  const db = await dbPromise,
    tx = db.transaction("guest", "readwrite");
  const s = ((await tx.store.get("story")) as GuestStory) ?? {
    progress: [],
    watched: [],
  };
  await tx.store.put(
    { ...s, watched: [...new Set([...s.watched, id])] },
    "story",
  );
  await tx.done;
}
export async function guestStoryRequest(body: {
  action: string;
  requestId?: string;
  stageId?: string;
  matchId?: string;
  version?: number;
  move?: BattleAction;
}) {
  const game = await readGame(),
    db = await dbPromise;
  const tx = db.transaction(["guest", "battleProgression"], "readwrite"),
    store = tx.objectStore("guest");
  const save = ((await store.get("story")) as GuestStory) ?? {
    progress: [],
    watched: [],
  };
  let state: BattleState;
  if (body.action === "start") {
    const existing = (await store.get("match:" + body.requestId)) as
      BattleState | undefined;
    if (existing) {
      await tx.done;
      return existing;
    }
    const stage = stageById(body.stageId ?? "");
    if (!stage || !unlocked(stage, save.progress))
      throw new Error("Story stage locked");
    state = storyBattle(
      createBattle(
        statsFor(game.loadout, game.items),
        Object.values(game.loadout),
        {
          level: crabLevel(game.progression.xp),
          blueprints: ownedBlueprints(game.loadout, game.items),
          moves: [game.progression.main, "guard", game.progression.special],
        },
      ),
      stage,
    );
    state.id = body.requestId!;
  } else {
    state = (await store.get("match:" + body.matchId)) as BattleState;
    if (!state) throw new Error("Match unavailable");
    if (state.version !== body.version || state.status !== "active") {
      await tx.done;
      return state;
    }
    state =
      body.action === "quit"
        ? {
            ...state,
            status: "forfeited",
            currentActorId: null,
            version: state.version + 1,
          }
        : resolveTurn(state, "player", body.move!);
  }
  const stage = stageById(state.storyStageId!)!;
  if (state.status === "active" && state.currentActorId === "cpu")
    state = resolveTurn(state, "cpu", storyCpu(state, stage));
  if (state.status === "completed" && state.winnerId === "player") {
    const prior = save.progress.find((p) => p.stage_id === stage.id),
      stars = storyStars(state, stage);
    if (prior) prior.best_stars = Math.max(prior.best_stars, stars);
    else {
      save.progress.push({ stage_id: stage.id, best_stars: stars });
      const before = await tx.objectStore("battleProgression").get("local");
      await tx
        .objectStore("battleProgression")
        .put(
          normalizeProgression(
            { ...before, xp: (before?.xp ?? 0) + stage.xp },
            ownedBlueprints(game.loadout, game.items),
          ),
          "local",
        );
    }
    await store.put(save, "story");
  }
  await store.put(state, "match:" + state.id);
  await tx.done;
  return state;
}
