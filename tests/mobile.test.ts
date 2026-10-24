import { it, expect, vi } from "vitest";
import {
  validFix,
  smoothFix,
  metres,
  companionPosition,
  startLocation,
  type LocationFix,
  type LocationProvider,
} from "../src/mobile/location";
const fix = (overrides: Partial<LocationFix> = {}): LocationFix => ({
  latitude: 30,
  longitude: -96,
  accuracy: 5,
  timestamp: 100000,
  ...overrides,
});
it("rejects stale, future, invalid and inaccurate locations without inventing a fix", () => {
  expect(validFix(fix(), 100000)).toBe(true);
  for (const value of [
    fix({ latitude: NaN }),
    fix({ longitude: 190 }),
    fix({ accuracy: -1 }),
    fix({ timestamp: 60000 }),
    fix({ timestamp: 110000 }),
  ])
    expect(validFix(value, 100000)).toBe(false);
  expect(smoothFix(null, fix({ accuracy: 51 }), 100000)).toBeNull();
  expect(smoothFix(fix(), fix({ timestamp: 99999 }), 100000)).toEqual(fix());
});
it("suppresses jitter and smooths physical movement according to accuracy and elapsed time", () => {
  const previous = fix(),
    next = fix({ latitude: 30.0001, timestamp: 102000 });
  const smooth = smoothFix(previous, next, 102000)!;
  expect(smooth.latitude).toBeGreaterThan(previous.latitude);
  expect(smooth.latitude).toBeLessThan(next.latitude);
  expect(
    smoothFix(previous, fix({ latitude: 30.000001, timestamp: 102000 }), 102000)
      ?.latitude,
  ).toBe(previous.latitude);
  expect(
    smoothFix(previous, fix({ latitude: 31, timestamp: 140000 }), 140000)
      ?.latitude,
  ).toBe(31);
});
it("companion follows the accepted path at a short geographic distance", () => {
  const a = fix(),
    b = fix({ latitude: 30.0001 }),
    c = fix({ latitude: 30.0001, longitude: -95.9999 });
  const companion = companionPosition([a, b, c], 4);
  expect(metres(companion, c)).toBeCloseTo(4, 1);
  expect(companion.latitude).toBe(c.latitude);
  expect(companionPosition([a], 4)).toEqual(a);
});
it("clears a watch created after cleanup and ignores late callbacks", async () => {
  let resolveWatch!: (id: string) => void;
  let callback!: (p: LocationFix | null) => void;
  const clear = vi.fn(async () => {}),
    onFix = vi.fn();
  const provider: LocationProvider = {
    current: async () => fix(),
    watch: (cb) => {
      callback = cb;
      return new Promise((r) => (resolveWatch = r));
    },
    clear,
  };
  const stop = startLocation(provider, onFix, vi.fn());
  await Promise.resolve();
  stop();
  resolveWatch("late");
  await Promise.resolve();
  callback(fix({ latitude: 31 }));
  expect(clear).toHaveBeenCalledWith("late");
  expect(onFix).toHaveBeenCalledTimes(1);
});
it("does not create a watch after a cancelled initial fix and reports initial errors", async () => {
  let resolve!: (p: LocationFix) => void;
  const watch = vi.fn(async () => "id"),
    error = vi.fn();
  const stop = startLocation(
    {
      current: () => new Promise((r) => (resolve = r)),
      watch,
      clear: async () => {},
    },
    vi.fn(),
    error,
  );
  stop();
  resolve(fix());
  await Promise.resolve();
  expect(watch).not.toHaveBeenCalled();
  startLocation(
    {
      current: async () => {
        throw new Error("denied");
      },
      watch,
      clear: async () => {},
    },
    vi.fn(),
    error,
  );
  await Promise.resolve();
  expect(error).toHaveBeenCalledOnce();
});
it("rejects unsupported and oversized capture files before decoding", async () => {
  const { normalizePhoto } = await import("../src/lib/pixel");
  await expect(
    normalizePhoto(new File(["fixture"], "bad.heic", { type: "image/heic" })),
  ).rejects.toThrow("JPG, PNG or WebP");
  await expect(
    normalizePhoto(
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.jpg", {
        type: "image/jpeg",
      }),
    ),
  ).rejects.toThrow("5 MB");
});
