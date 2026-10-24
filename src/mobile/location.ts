export type LocationFix = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};
export type LocationStatus =
  "idle" | "loading" | "ready" | "denied" | "unavailable" | "inaccurate";
export interface LocationProvider {
  current(): Promise<LocationFix>;
  watch(
    callback: (fix: LocationFix | null, error?: unknown) => void,
  ): Promise<string>;
  clear(id: string): Promise<void>;
}
export function validFix(f: LocationFix, now = Date.now()) {
  return (
    [f.latitude, f.longitude, f.accuracy, f.timestamp].every(Number.isFinite) &&
    Math.abs(f.latitude) <= 90 &&
    Math.abs(f.longitude) <= 180 &&
    f.accuracy >= 0 &&
    now - f.timestamp < 30000 &&
    f.timestamp <= now + 5000
  );
}
export function metres(a: LocationFix, b: LocationFix) {
  const rad = Math.PI / 180;
  const dlat = (b.latitude - a.latitude) * rad,
    dlng = (b.longitude - a.longitude) * rad;
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(a.latitude * rad) *
      Math.cos(b.latitude * rad) *
      Math.sin(dlng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}
export function smoothFix(
  previous: LocationFix | null,
  next: LocationFix,
  now = Date.now(),
): LocationFix | null {
  if (
    !validFix(next, now) ||
    next.accuracy > 50 ||
    (previous && next.timestamp <= previous.timestamp)
  )
    return previous;
  if (!previous || next.timestamp - previous.timestamp > 30000) return next;
  const distance = metres(previous, next);
  if (distance < Math.max(2, Math.min(previous.accuracy, next.accuracy) * 0.25))
    return { ...previous, timestamp: next.timestamp, accuracy: next.accuracy };
  const elapsed = (next.timestamp - previous.timestamp) / 1000;
  const weight = Math.min(1, Math.max(0.15, elapsed / (2 + next.accuracy / 5)));
  let longitudeDelta = next.longitude - previous.longitude;
  if (longitudeDelta > 180) longitudeDelta -= 360;
  if (longitudeDelta < -180) longitudeDelta += 360;
  return {
    ...next,
    latitude: previous.latitude + (next.latitude - previous.latitude) * weight,
    longitude:
      ((previous.longitude + longitudeDelta * weight + 540) % 360) - 180,
  };
}
export function companionPosition(trail: LocationFix[], trailingMetres = 4) {
  let remaining = trailingMetres;
  for (let i = trail.length - 1; i > 0; i--) {
    const a = trail[i],
      b = trail[i - 1],
      length = metres(a, b);
    if (length >= remaining) {
      const t = remaining / length;
      return {
        ...a,
        latitude: a.latitude + (b.latitude - a.latitude) * t,
        longitude: a.longitude + (b.longitude - a.longitude) * t,
      };
    }
    remaining -= length;
  }
  return trail[0];
}
// Stops late-created watches as well as callbacks from an obsolete lifecycle session.
export function startLocation(
  provider: LocationProvider,
  onFix: (fix: LocationFix) => void,
  onError: (error: unknown) => void,
) {
  let active = true,
    watchId: string | undefined;
  void (async () => {
    try {
      const first = await provider.current();
      if (!active) return;
      onFix(first);
      const id = await provider.watch((fix, error) => {
        if (active) {
          if (fix) onFix(fix);
          else onError(error);
        }
      });
      if (!active) await provider.clear(id);
      else watchId = id;
    } catch (error) {
      if (active) onError(error);
    }
  })();
  return () => {
    active = false;
    if (watchId) void provider.clear(watchId).catch(() => {});
  };
}
