import { openDB } from "idb";
import { rpc, cloudSession } from "../cloud/client";
import type { WalkSegment } from "./model";
export type WalkEvent = WalkSegment & { id: string; userId: string };
const database = () =>
  openDB("pixelogy-walking", 1, {
    upgrade(db) {
      db.createObjectStore("outbox", { keyPath: "id" });
    },
  });
export async function queueWalking(userId: string, segment: WalkSegment) {
  const db = await database();
  try {
    await db.put("outbox", { ...segment, id: crypto.randomUUID(), userId });
  } finally {
    db.close();
  }
}
export async function pendingWalking(userId: string) {
  const db = await database();
  try {
    return ((await db.getAll("outbox")) as WalkEvent[]).filter(
      (e) => e.userId === userId,
    );
  } finally {
    db.close();
  }
}
export async function syncWalking(userId: string) {
  const events = await pendingWalking(userId);
  let playerXp = 0,
    crabXp = 0;
  for (const event of events) {
    if ((await cloudSession())?.user.id !== userId) break;
    const result = await rpc<{ playerXp: number; crabXp: number }>(
      "credit_walk",
      {
        expected_user: userId,
        event_id: event.id,
        distance_mm: event.distanceMm,
        duration_ms: event.durationMs,
      },
    );
    const db = await database();
    try {
      await db.delete("outbox", event.id);
    } finally {
      db.close();
    }
    playerXp += result.playerXp;
    crabXp += result.crabXp;
  }
  return { playerXp, crabXp, changed: events.length > 0 };
}
