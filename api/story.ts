import { z } from "zod";
import type { AnalyzeRequest, AnalyzeResponse } from "./analyze.js";
import { authorized, receipt } from "../server/cloud.js";
import { playerBattle } from "../server/playerBattle.js";
import { resolveTurn, type BattleState } from "../src/lib/battle.js";
import { moves, type MoveId } from "../src/lib/moves.js";
import {
  stageById,
  storyBattle,
  storyCpu,
  storyStars,
  unlocked,
} from "../src/story/campaign.js";
const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("start"),
    requestId: z.uuid(),
    stageId: z.string(),
  }),
  z.object({
    action: z.literal("turn"),
    matchId: z.uuid(),
    version: z.number().int().nonnegative(),
    move: z.string(),
  }),
  z.object({
    action: z.literal("quit"),
    matchId: z.uuid(),
    version: z.number().int().nonnegative(),
  }),
]);
export default async function handler(
  req: AnalyzeRequest,
  res: AnalyzeResponse,
) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST")
    return res.status(405).json({ error: "Use POST." });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Invalid story request." });
  try {
    const { client, userId } = await authorized(req.headers),
      body = parsed.data;
    let state: BattleState,
      expectedVersion = -1;
    if (body.action === "start") {
      const stage = stageById(body.stageId);
      if (!stage) throw new Error("This chapter is not available yet.");
      const existing = await client
        .from("story_matches")
        .select("state")
        .eq("id", body.requestId)
        .eq("user_id", userId)
        .maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data) return res.status(200).json(existing.data.state);
      const progress = await client
        .from("story_progress")
        .select("stage_id,best_stars")
        .eq("user_id", userId);
      if (progress.error) throw progress.error;
      if (!unlocked(stage, progress.data))
        throw new Error("Defeat all four Shellshore trainers first.");
      state = storyBattle(await playerBattle(client, userId), stage);
      state.id = body.requestId;
    } else {
      const result = await client
        .from("story_matches")
        .select("state")
        .eq("id", body.matchId)
        .eq("user_id", userId)
        .single();
      if (result.error || !result.data)
        return res.status(404).json({ error: "Match not found." });
      state = result.data.state as BattleState;
      expectedVersion = state.version;
      if (state.version !== body.version || state.status !== "active")
        return res.status(200).json(state);
      if (body.action === "quit")
        state = {
          ...state,
          status: "forfeited",
          currentActorId: null,
          version: state.version + 1,
        };
      else {
        if (!Object.hasOwn(moves, body.move)) throw new Error("Unknown move.");
        state = resolveTurn(state, "player", body.move as MoveId);
      }
    }
    const stage = stageById(state.storyStageId!);
    if (!stage) throw new Error("Unknown stage.");
    if (state.status === "active" && state.currentActorId === "cpu")
      state = resolveTurn(state, "cpu", storyCpu(state, stage));
    const result = await client.rpc(
      "apply_story",
      receipt({
        purpose: "story",
        userId,
        expectedVersion,
        state,
        stars: storyStars(state, stage),
      }),
    );
    if (result.error) throw result.error;
    return res.status(200).json(result.data);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Story save unavailable. Please retry.";
    return res
      .status(message === "AUTH" ? 401 : message === "CONFIG" ? 503 : 400)
      .json({
        error:
          message === "CONFIG"
            ? "Online story battles are not configured yet."
            : message,
      });
  }
}
