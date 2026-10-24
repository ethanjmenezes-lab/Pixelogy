import type { Page } from "@playwright/test";
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
  await page.route("https://tiles.openfreemap.org/**", (route) =>
    route.fulfill({
      json: {
        version: 8,
        sources: {},
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#b8d7cf" },
          },
        ],
      },
    }),
  );
}
export async function takePhoto(page: Page) {
  await page.getByRole("button", { name: "Take photo", exact: true }).click();
  await page.getByRole("button", { name: "Choose item manually" }).waitFor();
}
