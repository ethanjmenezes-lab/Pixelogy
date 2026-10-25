import { mapTile } from "./mapFixture";
import { expect, type Page } from "@playwright/test";
// Test fixtures replace browser APIs only. No mock provider is shipped in the application.
export async function mockCamera(page: Page) {
  await page.addInitScript(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const context = canvas.getContext("2d")!;
    const paint = () => {
      context.fillStyle = "#e6d8af";
      context.fillRect(0, 0, 320, 240);
      context.fillStyle = "#8ca975";
      context.fillRect(100, 50, 100, 150);
    };
    paint();
    setInterval(paint, 50);
    Object.defineProperty(
      Object.getPrototypeOf(navigator.mediaDevices),
      "getUserMedia",
      { configurable: true, value: async () => canvas.captureStream(20) },
    );
  });
}
export async function mockLocation(page: Page) {
  await page.addInitScript(() => {
    let id = 0;
    const watchers = new Map<number, PositionCallback>();
    let latitude = 30.62,
      longitude = -96.34,
      accuracy = 5;
    const position = () =>
      ({
        coords: {
          latitude,
          longitude,
          accuracy,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      }) as GeolocationPosition;
    Object.defineProperties(Object.getPrototypeOf(navigator.geolocation), {
      getCurrentPosition: {
        value: (success: PositionCallback) => success(position()),
      },
      watchPosition: {
        value: (success: PositionCallback) => {
          watchers.set(++id, success);
          return id;
        },
      },
      clearWatch: { value: (key: number) => watchers.delete(key) },
    });
    window.addEventListener("test-location", (event) => {
      const detail = (event as CustomEvent).detail;
      latitude = detail.latitude ?? latitude;
      longitude = detail.longitude ?? longitude;
      accuracy = detail.accuracy ?? accuracy;
      watchers.forEach((fn) => fn(position()));
    });
  });
  await page.route("https://tiles.openfreemap.org/**", (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/planet")
      return route.fulfill({
        json: {
          tilejson: "3.0.0",
          tiles: ["https://tiles.openfreemap.org/test/{z}/{x}/{y}.pbf"],
          minzoom: 0,
          maxzoom: 14,
          vector_layers: [
            "landcover",
            "landuse",
            "waterway",
            "park",
            "water",
            "building",
            "transportation",
            "transportation_name",
          ].map((id) => ({ id, fields: {} })),
        },
      });
    const match = url.pathname.match(/\/test\/(\d+)\/(\d+)\/(\d+)\.pbf/);
    if (match)
      return route.fulfill({
        contentType: "application/x-protobuf",
        body: mapTile(+match[1], +match[2], +match[3]),
      });
    return route.abort();
  });
}
export async function enableScanning(page: Page) {
  const enable = page.getByRole("button", {
    name: "Enable automatic scanning",
  });
  await expect(
    enable
      .or(page.getByRole("button", { name: "Take photo", exact: true }))
      .first(),
  ).toBeVisible();
  if (await enable.isVisible()) await enable.click();
  // Consent is saved asynchronously; a second capture helper must not click
  // the disappearing consent button while its first save is still pending.
  await expect(
    page.getByRole("link", {
      name: "Automatic photo analysis is on · Privacy settings",
    }),
  ).toBeVisible();
}
export async function takePhoto(page: Page) {
  await enableScanning(page);
  await page.getByRole("button", { name: "Take photo", exact: true }).click();
  await page.getByRole("button", { name: "Retake photo" }).waitFor();
}

export const safeRecognition = {
  status: "matched",
  candidates: ["grocery-bag"],
  payload: "fixture",
  signature: "fixture",
  recognition: {
    objectName: "Plastic bag",
    material: "plastic",
    category: "bag",
    attributes: [],
    confidence: 0.95,
    ambiguous: false,
    safety: "allowed",
  },
};
export async function mockRecognition(
  page: Page,
  result: unknown = safeRecognition,
) {
  let count = 0;
  await page.route("**/api/analyze", (route) =>
    route.fulfill({
      json:
        result === safeRecognition
          ? { ...safeRecognition, payload: "fixture-" + ++count }
          : result,
    }),
  );
}
export async function identify(page: Page) {
  await page
    .getByText("Identified automatically · review your find", { exact: true })
    .waitFor();
}
