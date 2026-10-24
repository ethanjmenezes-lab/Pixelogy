import { useEffect, useRef, useState } from "react";
import { App } from "@capacitor/app";
import { locationProvider } from "./platform";
import {
  smoothFix,
  startLocation,
  validFix,
  type LocationFix,
  type LocationStatus,
} from "./location";
export function useDeviceLocation(enabled: boolean) {
  const [active, setActive] = useState(!document.hidden);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<LocationStatus>("idle");
  const [fix, setFix] = useState<LocationFix | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const last = useRef<LocationFix | null>(null);
  useEffect(() => {
    const visibility = () => setActive(!document.hidden);
    document.addEventListener("visibilitychange", visibility);
    const listener = App.addListener("appStateChange", ({ isActive }) =>
      setActive(isActive),
    );
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      void listener.then((l) => l.remove());
    };
  }, []);
  useEffect(() => {
    if (!enabled || !active) return;
    setStatus("loading");
    last.current = null;
    let received = Date.now();
    const stale = setInterval(() => {
      if (Date.now() - received > 30000) setStatus("unavailable");
    }, 5000);
    const stop = startLocation(
      locationProvider,
      (next) => {
        if (!validFix(next)) {
          setStatus("unavailable");
          return;
        }
        received = Date.now();
        setAccuracy(next.accuracy);
        if (next.accuracy > 50) {
          setStatus("inaccurate");
          return;
        }
        last.current = smoothFix(last.current, next);
        setFix(last.current);
        setStatus("ready");
      },
      (error) => {
        const code = (error as { code?: string | number })?.code;
        setStatus(
          code === 1 || code === "OS-PLUG-GLOC-0003" ? "denied" : "unavailable",
        );
      },
    );
    return () => {
      clearInterval(stale);
      stop();
    };
  }, [enabled, active, attempt]);
  return {
    fix,
    accuracy,
    status,
    active,
    retry: () => setAttempt((n) => n + 1),
  };
}
