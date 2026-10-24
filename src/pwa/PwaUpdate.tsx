import { useEffect, useState } from "react";
import { native } from "../mobile/platform";
export function PwaUpdate() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (native || !import.meta.env.PROD || !("serviceWorker" in navigator))
      return;
    let active = true;
    const cleanups: Array<() => void> = [];
    const reportVersion = () => {
      const entry = document.querySelector<HTMLScriptElement>(
        'script[type="module"][src]',
      )?.src;
      if (entry)
        navigator.serviceWorker.controller?.postMessage({
          type: "STATIC_CLIENT_READY",
          entry: new URL(entry).pathname,
        });
    };
    navigator.serviceWorker.addEventListener("controllerchange", reportVersion);
    document.addEventListener("visibilitychange", reportVersion);
    cleanups.push(
      () =>
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          reportVersion,
        ),
      () => document.removeEventListener("visibilitychange", reportVersion),
    );

    void navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((registration) => {
        if (!active) return;
        const check = () => {
          if (
            active &&
            registration.waiting &&
            navigator.serviceWorker.controller
          )
            setWaiting(registration.waiting);
        };
        const installing = () => {
          const worker = registration.installing;
          if (worker) {
            worker.addEventListener("statechange", check);
            cleanups.push(() =>
              worker.removeEventListener("statechange", check),
            );
          }
        };
        reportVersion();
        check();
        installing();
        registration.addEventListener("updatefound", installing);
        cleanups.push(() =>
          registration.removeEventListener("updatefound", installing),
        );
        const refresh = () => {
          if (!document.hidden && navigator.onLine)
            void registration.update().catch(() => {});
        };
        document.addEventListener("visibilitychange", refresh);
        cleanups.push(() =>
          document.removeEventListener("visibilitychange", refresh),
        );
      })
      .catch(() => {});
    return () => {
      active = false;
      cleanups.forEach((fn) => fn());
    };
  }, []);
  function apply() {
    if (!waiting || applying) return;
    if (waiting.state === "activated") {
      window.location.reload();
      return;
    }
    setApplying(true);
    setError("");
    const changed = () => {
      clearTimeout(timeout);
      window.location.reload();
    };
    const timeout = setTimeout(() => {
      navigator.serviceWorker.removeEventListener("controllerchange", changed);
      setApplying(false);
      setError("Update did not finish. Please try again.");
    }, 15000);
    navigator.serviceWorker.addEventListener("controllerchange", changed, {
      once: true,
    });
    waiting.postMessage({ type: "ACTIVATE_UPDATE" });
  }
  return waiting && !dismissed ? (
    <aside className="pwa-update" aria-label="App update" role="status">
      <strong>A new Pixelogy is ready.</strong>
      <span>Finish your scan or battle before reloading.</span>
      <button className="button secondary" onClick={apply} disabled={applying}>
        {applying ? "Updating…" : "Reload to update"}
      </button>
      <button
        className="button text"
        disabled={applying}
        onClick={() => setDismissed(true)}
      >
        Later
      </button>
      {error && <span>{error}</span>}
    </aside>
  ) : null;
}
