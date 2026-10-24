import { useEffect, useState } from "react";
import { useGame } from "../components/GameContext";
import { statsFor } from "../lib/gear";
import { equippedBlueprints, recordBattleResult } from "../lib/storage";
import { crabLevel, ownedBlueprints, normalizeProgression } from "../lib/moves";
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
  const { items, loadout, profile, progression, refresh } = useGame();
  const [reward, setReward] = useState<{
    id: string;
    text: string;
    saved: boolean;
  } | null>(null);
  const [rewardAttempt, setRewardAttempt] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [visible, setVisible] = useState(!document.hidden);
  useEffect(() => {
    const changed = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", changed);
    return () => document.removeEventListener("visibilitychange", changed);
  }, []);
  const battle = session?.battle;
  const blueprints = ownedBlueprints(loadout, items);
  const selected = normalizeProgression(progression, blueprints);
  useEffect(() => {
    if (battle?.status !== "completed") return;
    let active = true;
    void recordBattleResult(battle)
      .then(async (result) => {
        await refresh();
        if (active)
          setReward({
            id: battle.id,
            text: `+${result.xp} battle XP saved.`,
            saved: true,
          });
      })
      .catch(() => {
        if (active)
          setReward({
            id: battle.id,
            text: "Battle XP could not be saved. Retry before leaving.",
            saved: false,
          });
      });
    return () => {
      active = false;
    };
  }, [battle, rewardAttempt, refresh]);
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
              {
                level: crabLevel(selected.xp),
                blueprints,
                moves: [selected.main, "guard", selected.special],
              },
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
      if ((current.battle.fighters[0].cooldowns[action] ?? 0) > 0)
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
        level={crabLevel(selected.xp)}
        selectedMoves={[selected.main, "guard", selected.special]}
        start={start}
      />
    );
  return (
    <BattleArenaScreen
      {...session}
      rewardText={
        battle?.status === "completed"
          ? reward?.id === battle.id
            ? reward.text
            : "Saving battle XP…"
          : "Exit grants no battle XP."
      }
      rewardReady={
        battle?.status !== "completed" ||
        (reward?.id === battle.id && reward.saved)
      }
      rewardFailed={
        battle?.status === "completed" &&
        reward?.id === battle.id &&
        !reward.saved
      }
      retryReward={() => setRewardAttempt((n) => n + 1)}
      currentLevel={crabLevel(progression.xp)}
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
