import data from "./states.json";
import type { CleanupClaim } from "../lib/storage";
import type { Collectible } from "../lib/gear";
export const states = data;
export const validState = (code: unknown): code is string =>
  typeof code === "string" && states.some((s) => s.code === code);
type Point = number[];
function inside(point: Point, ring: Point[]) {
  let yes = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i],
      b = ring[j];
    if (
      a[1] > point[1] !== b[1] > point[1] &&
      point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      yes = !yes;
  }
  return yes;
}
function distance(point: Point, a: Point, b: Point) {
  const scale = Math.cos((point[1] * Math.PI) / 180),
    x = (a[0] - point[0]) * scale * 111195,
    y = (a[1] - point[1]) * 111195,
    dx = (b[0] - a[0]) * scale * 111195,
    dy = (b[1] - a[1]) * 111195,
    t = Math.max(0, Math.min(1, -(x * dx + y * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(x + t * dx, y + t * dy);
}
export function locateState(
  latitude: number,
  longitude: number,
  accuracy: number,
) {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180 ||
    !Number.isFinite(accuracy) ||
    accuracy < 0 ||
    accuracy > 100
  )
    return { state: null, candidates: [] } as {
      state: string | null;
      candidates: string[];
    };
  const point = [longitude, latitude],
    near: string[] = [];
  let match: string | null = null;
  for (const s of states) {
    const polygons = (
      s.geometry.type === "Polygon"
        ? [s.geometry.coordinates]
        : s.geometry.coordinates
    ) as Point[][][];
    for (const rings of polygons) {
      if (
        inside(point, rings[0]) &&
        !rings.slice(1).some((r) => inside(point, r))
      )
        match = s.code;
      // Cartographic simplification is not survey precision: use a conservative 2 km margin.
      if (
        rings.some((r) =>
          r.some(
            (a, i) =>
              i > 0 &&
              Math.abs(a[0] - r[i - 1][0]) < 180 &&
              distance(point, a, r[i - 1]) <= accuracy + 2000,
          ),
        )
      ) {
        near.push(s.code);
        break;
      }
    }
  }
  return { state: near.length ? null : match, candidates: [...new Set(near)] };
}
export function stateStats(
  code: string,
  claims: CleanupClaim[],
  items: Collectible[],
) {
  const rows = [
    ...new Map(
      claims
        .filter((c) => c.stateCode === code)
        .map((c) => [c.collectibleId, c]),
    ).values(),
  ];
  const types = [
    ...new Set(
      rows.map(
        (c) =>
          items.find((i) => i.id === c.collectibleId)?.catalogId ?? c.category,
      ),
    ),
  ];
  return {
    pickups: rows.length,
    types: types.length,
    first: rows.map((c) => c.confirmedAtIso).sort()[0],
  };
}
