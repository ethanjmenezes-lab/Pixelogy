import { creditGuestWalk } from "../guest/local";
import { useCallback, useEffect, useRef, useState } from "react";
import { useGame } from "../components/GameContext";
import { rpc } from "../cloud/client";
import type { LocationFix } from "../mobile/location";
import { rules, walkingStep } from "./model";
import { pendingWalking, queueWalking, syncWalking } from "./walkingStore";
export function useWalking() {
  const { userId, refresh } = useGame();
  const anchor = useRef<LocationFix | null>(null),
    busy = useRef(false);
  const currentUser = useRef(userId);
  currentUser.current = userId;
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(0);
  const reset = useCallback(() => {
    anchor.current = null;
  }, []);
  const receive = useCallback(
    (fix: LocationFix) => {
      if (document.hidden) {
        anchor.current = null;
        return;
      }
      const next = walkingStep(anchor.current, fix);
      anchor.current = next.anchor;
      if (next.segment && !userId) {
        void creditGuestWalk(crypto.randomUUID(), next.segment)
          .then(async (award) => {
            if (currentUser.current !== null) return;
            if (award.playerXp || award.crabXp)
              setNotice(
                `+${award.playerXp} Player XP · +${award.crabXp} Crab XP`,
              );
            await refresh();
          })
          .catch(() =>
            setNotice("Walking could not be saved. Check browser storage."),
          );
        return;
      }
      if (next.segment && userId)
        void queueWalking(userId, next.segment)
          .then(async () => {
            const events = await pendingWalking(userId);
            if (currentUser.current === userId)
              setPending(events.reduce((n, e) => n + e.distanceMm, 0));
          })
          .catch(() =>
            setNotice("Walking could not be saved. Check browser storage."),
          );
    },
    [userId, refresh],
  );
  useEffect(() => {
    anchor.current = null;
    setPending(0);
    setNotice("");
    if (!userId) return;
    let active = true;
    void pendingWalking(userId)
      .then((events) => {
        if (active) setPending(events.reduce((n, e) => n + e.distanceMm, 0));
      })
      .catch(() => {
        if (active) setNotice("Walking storage is unavailable.");
      });
    const sync = async () => {
      if (busy.current || !navigator.onLine) return;
      busy.current = true;
      try {
        await rpc("begin_walk", {});
        const result = await syncWalking(userId);
        const remaining = await pendingWalking(userId);
        if (active) {
          setPending(remaining.reduce((n, e) => n + e.distanceMm, 0));
          if (result.playerXp || result.crabXp)
            setNotice(
              `+${result.playerXp} Player XP · +${result.crabXp} Crab XP`,
            );
          if (result.changed) await refresh();
        }
      } catch {
        if (active) await refresh();
        if (active) setNotice("Walking saved on this device. Waiting to sync.");
      } finally {
        busy.current = false;
      }
    };
    void rpc("begin_walk", {})
      .then(sync)
      .catch(() => {
        if (active) setNotice("Connect to sync walking progress.");
      });
    const interval = setInterval(() => void sync(), rules.syncMs);
    window.addEventListener("online", sync);
    return () => {
      active = false;
      anchor.current = null;
      clearInterval(interval);
      window.removeEventListener("online", sync);
    };
  }, [userId, refresh]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 6000);
    return () => clearTimeout(t);
  }, [notice]);
  return { receive, reset, notice, pending };
}
