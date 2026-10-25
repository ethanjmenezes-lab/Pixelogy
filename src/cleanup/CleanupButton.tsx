import { useRef, useEffect, useState } from "react";
import { claimCleanup } from "../lib/storage";
import { useGame } from "../components/GameContext";
import { locateState, states } from "./states";
import { validFix } from "../mobile/location";
export function CleanupButton({
  id,
  disabled = false,
}: {
  id: string;
  disabled?: boolean;
}) {
  const { refresh, userId } = useGame(),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [candidates, setCandidates] = useState<string[]>([]),
    alive = useRef(true),
    lock = useRef(false),
    identity = useRef(userId);
  identity.current = userId;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  async function save(code: string | null, owner = userId) {
    if (!alive.current || identity.current !== owner) return;
    try {
      const c = await claimCleanup(id, crypto.randomUUID(), code);
      if (alive.current) {
        setMessage(
          `+${c.xpAwarded} cleanup XP saved.${c.stateCode ? " " + c.stateCode + " recorded." : " No state assigned."}`,
        );
        setCandidates([]);
        await refresh();
      }
    } catch (e) {
      if (alive.current) setMessage((e as Error).message);
    } finally {
      lock.current = false;
      if (alive.current) setBusy(false);
    }
  }
  async function report() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage("Checking state on this device…");
    const owner = userId;
    const fix = await new Promise<GeolocationPosition | null>((resolve) => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      });
    });
    if (!alive.current || identity.current !== owner) return;
    const result =
      fix &&
      validFix({
        latitude: fix.coords.latitude,
        longitude: fix.coords.longitude,
        accuracy: fix.coords.accuracy,
        timestamp: fix.timestamp,
      })
        ? locateState(
            fix.coords.latitude,
            fix.coords.longitude,
            fix.coords.accuracy,
          )
        : { state: null, candidates: [] };
    if (result.candidates.length) {
      setCandidates(result.candidates);
      setMessage(
        "Near a mapped boundary. Confirm your state, or save without one.",
      );
      return;
    }
    await save(result.state, owner);
  }
  return (
    <div className="cleanup-confirm">
      <p className="field-help">
        Optional self-report: I picked up and safely disposed of this litter.
        Location is used only to determine a state; coordinates are discarded.
      </p>
      <button
        className="button secondary"
        disabled={disabled || busy}
        onClick={() => void report()}
      >
        I Picked It Up
      </button>
      {candidates.length > 0 && (
        <div role="group" aria-label="Confirm cleanup state">
          {candidates.map((code) => (
            <button
              className="button secondary"
              key={code}
              onClick={() => void save(code)}
            >
              {states.find((s) => s.code === code)!.name}
            </button>
          ))}
          <button className="button text" onClick={() => void save(null)}>
            Save without state
          </button>
        </div>
      )}
      {message && <p role="status">{message}</p>}
    </div>
  );
}
