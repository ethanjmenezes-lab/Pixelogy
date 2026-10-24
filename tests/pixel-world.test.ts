import { it, expect } from "vitest";
import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";
import {
  pixelWorldStyle,
  terrainPatterns,
  terrainTile,
  coast,
} from "../src/world/pixelStyle";
it("validates the authored style and preserves geographic roads, bridges, buildings and water", () => {
  const style = pixelWorldStyle();
  expect(validateStyleMin(style)).toEqual([]);
  const ids = style.layers.map((l) => l.id);
  for (const id of [
    "pixel-path",
    "bridge-path",
    "pixel-parks",
    "pixel-water",
    "pixel-buildings",
    "rail",
  ])
    expect(ids).toContain(id);
  expect(ids.indexOf("bridge-path")).toBeGreaterThan(
    ids.indexOf("pixel-water"),
  );
  expect(style.sources.world.type).toBe("vector");
});
it("generates deterministic opaque original pixel tiles", () => {
  for (const pattern of terrainPatterns) {
    const tile = terrainTile(pattern);
    expect(tile.data).toEqual(terrainTile(pattern).data);
    expect(tile.data.length).toBe(16 * 16 * 4);
    expect(
      [...tile.data].filter((_, i) => i % 4 === 3).every((a) => a === 255),
    ).toBe(true);
    expect(new Set(tile.data).size).toBeGreaterThan(3);
  }
});
it("keeps core text pairings above WCAG normal text contrast", () => {
  const luminance = (hex: string) => {
    const rgb = hex
      .slice(1)
      .match(/../g)!
      .map((h) => parseInt(h, 16) / 255)
      .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  };
  for (const [a, b] of [
    [coast.ink, coast.cream],
    [coast.purple, coast.cream],
    [coast.ink, coast.orange],
    [coast.ink, coast.mint],
  ]) {
    const l = [luminance(a), luminance(b)].sort((a, b) => b - a);
    expect((l[0] + 0.05) / (l[1] + 0.05)).toBeGreaterThanOrEqual(4.5);
  }
});
