import { useEffect, useState } from "react";
import type { BattleState } from "../lib/battle";
import {
  nextFrame,
  openingFrame,
  PHASE_MS,
  type CombatPhase,
} from "./presentation";
export function useCombatPresentation(
  authoritative: BattleState,
  visible: boolean,
) {
  const [frame, setFrame] = useState(() => openingFrame(authoritative));
  const [phase, setPhase] = useState<CombatPhase>("ready");
  const [action, setAction] = useState<
    BattleState["log"][number] | undefined
  >();
  const pending = authoritative.version > frame.version;
  useEffect(() => {
    if (!visible || authoritative.status === "forfeited") return;
    const delay = phase === "ready" ? 0 : PHASE_MS[phase];
    const timer = setTimeout(() => {
      if (document.hidden) return;
      if (phase === "windup") {
        const next = nextFrame(frame, authoritative);
        if (next) setFrame(next);
        setPhase("impact");
      } else if (phase === "impact") setPhase("transition");
      else if (pending) {
        setAction(authoritative.log.find((e) => e.turn === frame.version + 1));
        setPhase("windup");
      } else {
        setAction(undefined);
        setPhase("ready");
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [authoritative, visible, frame, phase, pending]);
  if (authoritative.status === "forfeited")
    return {
      battle: authoritative,
      phase: "ready" as const,
      action: undefined,
      resolving: false,
    };
  return {
    battle: frame,
    phase,
    action,
    resolving: pending || phase !== "ready",
  };
}
