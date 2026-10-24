import { useEffect, useRef, useState } from "react";
import { App } from "@capacitor/app";
import { native } from "./platform";
import { captureNative, takeRestored, onRestored } from "./capture";
export function CameraCapture({ onPhoto }: { onPhoto: (file: File) => void }) {
  const video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null);
  const callback = useRef(onPhoto);
  callback.current = onPhoto;
  const [error, setError] = useState(""),
    [ready, setReady] = useState(false),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const stop = () => {
      stream.current?.getTracks().forEach((t) => t.stop());
      stream.current = null;
      setReady(false);
    };
    const accept = (file: File) => {
      if (active) {
        stop();
        callback.current(file);
      }
    };
    const unsubscribe = onRestored(accept);
    const restored = takeRestored();
    if (restored) accept(restored);
    else if (native)
      void captureNative()
        .then(accept)
        .catch(() => {
          if (active)
            setError(
              "Camera closed or permission denied. Retry to take a photo, or return to the world.",
            );
        });
    else
      void navigator.mediaDevices
        ?.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        })
        .then((media) => {
          if (!active) {
            media.getTracks().forEach((t) => t.stop());
            return;
          }
          stream.current = media;
          if (video.current) {
            video.current.srcObject = media;
            void video.current.play().catch(() => {});
          }
          setReady(true);
        })
        .catch(() => {
          if (active)
            setError(
              "Camera unavailable. Allow camera access in browser settings and retry.",
            );
        });
    if (!native && !navigator.mediaDevices)
      setError(
        "Live camera requires HTTPS or localhost and a supported browser.",
      );
    const visibility = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", visibility);
    const appListener = App.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) stop();
    });
    return () => {
      active = false;
      stop();
      unsubscribe();
      document.removeEventListener("visibilitychange", visibility);
      void appListener.then((l) => l.remove());
    };
  }, [attempt]);
  async function take() {
    const element = video.current;
    if (!element?.videoWidth) return;
    const canvas = document.createElement("canvas");
    const scale = Math.min(
      1,
      1280 / Math.max(element.videoWidth, element.videoHeight),
    );
    canvas.width = Math.round(element.videoWidth * scale);
    canvas.height = Math.round(element.videoHeight * scale);
    canvas
      .getContext("2d")!
      .drawImage(element, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) {
          stream.current?.getTracks().forEach((t) => t.stop());
          callback.current(
            new File([blob], "capture.jpg", { type: "image/jpeg" }),
          );
        }
      },
      "image/jpeg",
      0.85,
    );
  }
  return (
    <div>
      {!native && (
        <video
          className="camera-live"
          ref={video}
          autoPlay
          playsInline
          muted
          aria-label="Live rear camera preview"
        />
      )}
      {error && <p role="alert">{error}</p>}
      <div className="camera-actions">
        {!native && ready && (
          <button className="button primary" onClick={() => void take()}>
            Take photo
          </button>
        )}
        {(!ready || error) && (
          <button
            className="button secondary"
            onClick={() => {
              setError("");
              setAttempt((n) => n + 1);
            }}
          >
            Retry camera
          </button>
        )}
      </div>
    </div>
  );
}
