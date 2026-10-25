import rules from "./config.json";
import { metres, validFix, type LocationFix } from "../mobile/location";
export { rules };
export type PlayerProgress = { xp: number; distanceMm: number };
export const emptyPlayer = (): PlayerProgress => ({ xp: 0, distanceMm: 0 });
export function playerLevel(xp: number) {
  return 1 + Math.floor(Math.max(0, xp) / rules.xpPerLevel);
}
export type WalkSegment = { distanceMm: number; durationMs: number };
// Raw foreground fixes only. Display smoothing/panning never enters this reducer.
export function walkingStep(
  anchor: LocationFix | null,
  next: LocationFix,
  now = Date.now(),
): { anchor: LocationFix | null; segment?: WalkSegment } {
  if (!validFix(next, now) || next.accuracy > rules.maxAccuracy)
    return { anchor: null };
  if (!anchor) return { anchor: next };
  const durationMs = next.timestamp - anchor.timestamp;
  if (durationMs <= 0) return { anchor };
  if (durationMs > rules.maxGapMs) return { anchor: next };
  const distance = metres(anchor, next),
    speed = distance / (durationMs / 1000);
  if (speed > rules.maxSpeed) return { anchor: next };
  if (
    distance < Math.max(rules.minDistance, anchor.accuracy + next.accuracy) ||
    speed < rules.minSpeed
  )
    return { anchor };
  return {
    anchor: next,
    segment: {
      distanceMm: Math.floor(distance * 1000),
      durationMs: Math.floor(durationMs),
    },
  };
}
export function walkingAward(beforeMm: number, acceptedMm: number) {
  const milestones =
    Math.floor((beforeMm + acceptedMm) / rules.milestoneMm) -
    Math.floor(beforeMm / rules.milestoneMm);
  return {
    playerXp: milestones * rules.playerXp,
    crabXp: milestones * rules.crabXp,
  };
}
