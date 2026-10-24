import { it, expect, vi, beforeEach } from "vitest";
const camera = vi.hoisted(() => vi.fn());
vi.mock("@capacitor/camera", () => ({
  Camera: { getPhoto: camera },
  CameraSource: { Camera: "CAMERA" },
  CameraDirection: { Rear: "REAR" },
  CameraResultType: { Uri: "uri" },
}));
const appListener = vi.hoisted(() => vi.fn());
vi.mock("@capacitor/app", () => ({ App: { addListener: appListener } }));
import {
  captureNative,
  listenRestoredCapture,
  onRestored,
} from "../src/mobile/capture";
beforeEach(() => {
  camera.mockReset();
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      blob: async () => new Blob(["photo"], { type: "image/jpeg" }),
    })),
  );
});
it("deduplicates native launch and uses camera-only rear capture without gallery save", async () => {
  let finish!: (photo: unknown) => void;
  camera.mockReturnValue(new Promise((resolve) => (finish = resolve)));
  const first = captureNative(),
    second = captureNative();
  expect(first).toBe(second);
  expect(camera).toHaveBeenCalledTimes(1);
  expect(camera).toHaveBeenCalledWith(
    expect.objectContaining({
      source: "CAMERA",
      direction: "REAR",
      saveToGallery: false,
    }),
  );
  finish({ webPath: "capacitor://local/photo", format: "jpeg" });
  expect((await first).type).toBe("image/jpeg");
});
it("allows an explicit retry after camera cancellation", async () => {
  camera.mockRejectedValueOnce(new Error("cancelled"));
  await expect(captureNative()).rejects.toThrow("cancelled");
  camera.mockResolvedValue({
    webPath: "capacitor://local/photo",
    format: "jpeg",
  });
  await captureNative();
  expect(camera).toHaveBeenCalledTimes(2);
});

it("routes restored Android camera results through the same photo pipeline", async () => {
  const receive = vi.fn();
  const unsubscribe = onRestored(receive);
  listenRestoredCapture();
  const callback = appListener.mock.calls.at(-1)![1];
  callback({
    pluginId: "Camera",
    methodName: "getPhoto",
    success: true,
    data: { webPath: "capacitor://restored", format: "jpeg" },
  });
  await vi.waitFor(() => expect(receive).toHaveBeenCalledOnce());
  expect(receive.mock.calls[0][0]).toBeInstanceOf(File);
  unsubscribe();
});
