import {
  Camera,
  CameraDirection,
  CameraResultType,
  CameraSource,
  type Photo,
} from "@capacitor/camera";
import { App } from "@capacitor/app";
let pending: Promise<File> | null = null;
let restored: File | null = null;
const listeners = new Set<(file: File) => void>();
export async function photoFile(photo: Photo) {
  if (!photo.webPath)
    throw new Error("Camera returned no photo. Please retake.");
  const response = await fetch(photo.webPath);
  if (!response.ok)
    throw new Error("Could not read the camera photo. Please retake.");
  const blob = await response.blob();
  return new File([blob], `capture.${photo.format}`, {
    type: blob.type || `image/${photo.format}`,
  });
}
export function captureNative() {
  if (!pending)
    pending = Camera.getPhoto({
      source: CameraSource.Camera,
      direction: CameraDirection.Rear,
      resultType: CameraResultType.Uri,
      quality: 85,
      width: 1280,
      height: 1280,
      correctOrientation: true,
      saveToGallery: false,
    })
      .then(photoFile)
      .finally(() => {
        pending = null;
      });
  return pending;
}
export function takeRestored() {
  const file = restored;
  restored = null;
  return file;
}
export function onRestored(callback: (file: File) => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
export function listenRestoredCapture() {
  return App.addListener("appRestoredResult", (result) => {
    if (
      result.pluginId !== "Camera" ||
      result.methodName !== "getPhoto" ||
      !result.success
    )
      return;
    void photoFile(result.data as Photo)
      .then((file) => {
        if (listeners.size) listeners.forEach((fn) => fn(file));
        else {
          restored = file;
          window.dispatchEvent(new Event("pixelogy-restored-capture"));
        }
      })
      .catch(() => {});
  });
}
