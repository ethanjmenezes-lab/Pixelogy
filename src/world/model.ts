export type Point = { x: number; y: number };
export type Facing = "down" | "up" | "left" | "right";
export type LocationSource = {
  kind: "demo" | "gps";
  position: Point;
  moving: boolean;
  facing: Facing;
};
export const WORLD_SCALE = 2;
export const TILE = 16,
  WORLD_SIZE = 48;
export const SPAWN: Point = { x: 24 * 16 + 8, y: 25 * 16 + 8 };
export const houses = [
  { x: 18, y: 16, w: 4, h: 5, color: "coral", name: "SHORE POST" },
  { x: 27, y: 18, w: 4, h: 5, color: "blue", name: "TIDE HOUSE" },
  { x: 17, y: 29, w: 5, h: 4, color: "gold", name: "WORKSHOP" },
];
export const trees = [
  ...[7, 10, 13, 17, 21, 25, 29, 33, 37, 40].map((x, i) => ({
    x,
    y: 9 + (i % 3),
  })),
  { x: 10, y: 17 },
  { x: 10, y: 22 },
  { x: 12, y: 28 },
  { x: 14, y: 34 },
  { x: 28, y: 29 },
  { x: 32, y: 30 },
  { x: 37, y: 15 },
  { x: 39, y: 20 },
  { x: 37, y: 25 },
  { x: 8, y: 33 },
  { x: 31, y: 35 },
];
export function terrain(
  x: number,
  y: number,
): "grass" | "path" | "sand" | "water" | "pier" {
  if (x >= 23 && x <= 25 && y >= 35 && y <= 43) return "pier";
  if (y >= 38 + Math.floor(Math.sin(x * 0.3) * 1.3)) return "water";
  if (y >= 34 + Math.floor(Math.sin(x * 0.3) * 1.3)) return "sand";
  if (
    (x >= 23 && x <= 25 && y >= 10) ||
    (y >= 23 && y <= 25 && x >= 9 && x <= 38) ||
    (y >= 20 && y <= 23 && x >= 16 && x <= 18) ||
    (y >= 21 && y <= 24 && x >= 31 && x <= 33) ||
    (y >= 25 && y <= 29 && x >= 19 && x <= 20)
  )
    return "path";
  return "grass";
}
export function walkable(p: Point) {
  const x = Math.floor(p.x / TILE),
    y = Math.floor(p.y / TILE);
  if (x < 2 || y < 2 || x >= 46 || y >= 46 || terrain(x, y) === "water")
    return false;
  if (
    houses.some(
      (h) =>
        p.x >= h.x * TILE - 3 &&
        p.x < (h.x + h.w) * TILE + 3 &&
        p.y >= (h.y + 1) * TILE &&
        p.y < (h.y + h.h) * TILE + 3,
    )
  )
    return false;
  if (
    trees.some(
      (t) =>
        Math.abs(p.x - (t.x * 16 + 8)) < 10 &&
        Math.abs(p.y - (t.y * 16 + 14)) < 8,
    )
  )
    return false;
  return true;
}
export function normalizeInput(v: Point): Point {
  const length = Math.hypot(v.x, v.y);
  return length > 1 ? { x: v.x / length, y: v.y / length } : v;
}
export function movePlayer(
  position: Point,
  input: Point,
  seconds: number,
): Point {
  const v = normalizeInput(input),
    distance = 42 * Math.min(0.05, Math.max(0, seconds));
  const next = { ...position };
  if (walkable({ x: next.x + v.x * distance, y: next.y }))
    next.x += v.x * distance;
  if (walkable({ x: next.x, y: next.y + v.y * distance }))
    next.y += v.y * distance;
  return next;
}
export function followTrail(trail: Point[], distance = 21): Point {
  let remaining = distance;
  for (let i = trail.length - 1; i > 0; i--) {
    const a = trail[i],
      b = trail[i - 1],
      length = Math.hypot(a.x - b.x, a.y - b.y);
    if (length >= remaining) {
      const t = remaining / length;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    remaining -= length;
  }
  return { ...trail[0] };
}
export function levelFor(xp: number) {
  const safe = Math.max(0, Math.floor(xp));
  return { level: 1 + Math.floor(safe / 100), progress: safe % 100 };
}
export function cameraFor(player: Point, detached: Point | null): Point {
  return detached ?? player;
}
