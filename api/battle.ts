import { z } from "zod";
import type { AnalyzeRequest, AnalyzeResponse } from "./analyze.js";
import { authorized, receipt } from "../server/cloud.js";
import { resolveTurn, cpuAction, type BattleState } from "../src/lib/battle.js";
import { moves, type MoveId } from "../src/lib/moves.js";
import { playerBattle } from "../server/playerBattle.js";
const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start"), requestId: z.uuid() }),
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
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: "Invalid battle request." });
  try {
    const { client, userId } = await authorized(req.headers);
    const body = parsed.data;
    let state: BattleState,
      expectedVersion = -1;
    if (body.action === "start") {
      const existing = await client
        .from("practice_matches")
        .select("state")
        .eq("id", body.requestId)
        .eq("user_id", userId)
        .maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data) return res.status(200).json(existing.data.state);
      state = await playerBattle(client, userId);
      state.id = body.requestId;
    } else {
      const { data, error } = await client
        .from("practice_matches")
        .select("state")
        .eq("id", body.matchId)
        .eq("user_id", userId)
        .single();
      if (error || !data)
        return res.status(404).json({ error: "Match not found." });
      state = data.state as BattleState;
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
        if (!Object.hasOwn(moves, body.move))
          return res.status(400).json({ error: "Unknown move." });
        state = resolveTurn(state, "player", body.move as MoveId);
      }
    }
    if (state.status === "active" && state.currentActorId === "cpu")
      state = resolveTurn(state, "cpu", cpuAction(state));
    // Start remains version 0 for the normal speed-tie player-first roster.
    const signed = receipt({
      purpose: "battle",
      userId,
      expectedVersion,
      state,
    });
    const { data, error } = await client.rpc("apply_practice", signed);
    if (error) throw error;
    return res.status(200).json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Battle unavailable";
    return res
      .status(message === "AUTH" ? 401 : message === "CONFIG" ? 503 : 400)
      .json({
        error:
          message === "CONFIG" ? "Cloud battle is not configured." : message,
      });
  }
}
