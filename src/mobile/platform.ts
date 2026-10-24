import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";
import type { LocationProvider } from "./location";
export const native = Capacitor.isNativePlatform();
export const locationProvider: LocationProvider = {
  async current() {
    if (native)
      await Geolocation.requestPermissions({ permissions: ["location"] });
    const p = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0,
    });
    return { ...p.coords, timestamp: p.timestamp };
  },
  watch(callback) {
    return Geolocation.watchPosition(
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
        minimumUpdateInterval: 2000,
      },
      (p, e) => callback(p ? { ...p.coords, timestamp: p.timestamp } : null, e),
    );
  },
  clear(id) {
    return Geolocation.clearWatch({ id });
  },
};
export function analyzeUrl() {
  const base = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!base) {
    if (native)
      throw new Error(
        "Native Gemini endpoint is not configured. Please try again later.",
      );
    return "/api/analyze";
  }
  const url = new URL(base);
  if (url.protocol !== "https:")
    throw new Error("The Gemini backend must use HTTPS.");
  return new URL("/api/analyze", url).href;
}
