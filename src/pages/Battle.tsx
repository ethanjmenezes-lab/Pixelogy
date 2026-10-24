import { useEffect, useState } from "react";
import { useGame } from "../components/GameContext";
import { statsFor } from "../lib/gear";
import { equippedBlueprints } from "../lib/storage";
import {
  createBattle,
  resolveTurn,
  cpuAction,
  type BattleAction,
  type BattleState,
} from "../lib/battle";
import type { Profile } from "../world/profile";
import { BattleIntroScreen, BattleArenaScreen } from "../battle/BattleScreens";

type Session = { battle: BattleState; gear: string[]; trainer: Profile };
export function Battle() {
  const { items, loadout, profile } = useGame();
  const [session, setSession] = useState<Session | null>(null);
  const [visible, setVisible] = useState(!document.hidden);
  useEffect(() => {
    const changed = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", changed);
    return () => document.removeEventListener("visibilitychange", changed);
  }, []);
  const battle = session?.battle;
  useEffect(() => {
    if (
      !visible ||
      battle?.currentActorId !== "cpu" ||
      battle.status !== "active"
    )
      return;
    const id = battle.id;
    const timer = setTimeout(
      () =>
        setSession((current) => {
          if (
            document.hidden ||
            !current ||
            current.battle.id !== id ||
            current.battle.status !== "active" ||
            current.battle.currentActorId !== "cpu"
          )
            return current;
          return {
            ...current,
            battle: resolveTurn(
              current.battle,
              "cpu",
              cpuAction(current.battle),
            ),
          };
        }),
      850,
    );
    return () => clearTimeout(timer);
  }, [
    visible,
    battle?.id,
    battle?.currentActorId,
    battle?.status,
    battle?.version,
  ]);
  function start() {
    setSession((current) =>
      current?.battle.status === "active"
        ? current
        : {
            battle: createBattle(
              statsFor(loadout, items),
              Object.values(loadout),
            ),
            gear: equippedBlueprints(loadout, items),
            trainer: { ...profile },
          },
    );
  }
  function act(action: BattleAction) {
    setSession((current) => {
      if (
        !current ||
        current.battle.status !== "active" ||
        current.battle.currentActorId !== "player"
      )
        return current;
      if (
        action === "tidal_slam" &&
        current.battle.fighters[0].tidalCooldownRemaining > 0
      )
        return current;
      return {
        ...current,
        battle: resolveTurn(current.battle, "player", action),
      };
    });
  }
  if (!session)
    return (
      <BattleIntroScreen
        stats={statsFor(loadout, items)}
        gear={equippedBlueprints(loadout, items)}
        start={start}
      />
    );
  return (
    <BattleArenaScreen
      {...session}
      act={act}
      replay={start}
      intro={() => setSession(null)}
      quit={() =>
        setSession((current) =>
          current
            ? {
                ...current,
                battle: {
                  ...current.battle,
                  status: "forfeited",
                  currentActorId: null,
                },
              }
            : null,
        )
      }
    />
  );
}
