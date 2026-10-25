import { useEffect, useState, useRef } from "react";
import { authHeaders } from "../cloud/client";
import { analyzeUrl } from "../mobile/platform";
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

type Session = {
  battle: BattleState;
  gear: string[];
  trainer: Profile;
  remote?: boolean;
  offline?: boolean;
};
export function Battle() {
  const { userId } = useGame();
  return <BattleSession key={userId ?? "local"} />;
}
function BattleSession() {
  const {
    items,
    loadout,
    profile,
    progression,
    refresh,
    userId,
    cloudOffline,
  } = useGame();
  const requestLock = useRef(false);
  const [requestPending, setRequestPending] = useState(false);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const [networkError, setNetworkError] = useState("");
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
    if (session?.remote || session?.offline) return;
    let active = true;
    void recordBattleResult(battle)
      .then(async (result) => {
        await refresh();
        if (active)
          setReward({
            id: battle.id,
            text: `+${result.xp} Crab XP saved.`,
            saved: true,
          });
      })
      .catch(() => {
        if (active)
          setReward({
            id: battle.id,
            text: "Crab XP could not be saved. Retry before leaving.",
            saved: false,
          });
      });
    return () => {
      active = false;
    };
  }, [battle, rewardAttempt, refresh, session?.remote, session?.offline]);
  useEffect(() => {
    if (
      session?.remote ||
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
    session?.remote,
    visible,
    battle?.id,
    battle?.currentActorId,
    battle?.status,
    battle?.version,
  ]);
  async function remoteRequest(body: object) {
    const response = await fetch(analyzeUrl().replace(/analyze$/, "battle"), {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Battle unavailable");
    return data as BattleState;
  }
  async function remoteAction(action: "turn" | "quit", move?: BattleAction) {
    if (requestLock.current || !session) return;
    requestLock.current = true;
    setRequestPending(true);
    setNetworkError("");
    try {
      const next = await remoteRequest({
        action,
        matchId: session.battle.id,
        version: session.battle.version,
        move,
      });
      if (!alive.current) return;
      setSession((current) =>
        current?.battle.id === next.id ? { ...current, battle: next } : current,
      );
      if (next.status === "completed") await refresh();
    } catch (e) {
      setNetworkError((e as Error).message);
    } finally {
      requestLock.current = false;
      if (alive.current) setRequestPending(false);
    }
  }
  function start() {
    if (userId && !cloudOffline && navigator.onLine) {
      if (requestLock.current || session?.battle.status === "active") return;
      requestLock.current = true;
      setNetworkError("");
      void remoteRequest({ action: "start", requestId: crypto.randomUUID() })
        .then((battle) =>
          setSession({
            battle,
            gear: battle.fighters[0].snapshotBlueprints,
            trainer: { ...profile },
            remote: true,
          }),
        )
        .catch((e) => setNetworkError(e.message))
        .finally(() => {
          requestLock.current = false;
        });
      return;
    }
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
            offline: !!userId,
          },
    );
  }
  function act(action: BattleAction) {
    if (session?.remote) {
      void remoteAction("turn", action);
      return;
    }
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
      <>
        {networkError && (
          <p role="alert" className="notice error">
            {networkError}
          </p>
        )}
        <BattleIntroScreen
          stats={statsFor(loadout, items)}
          gear={equippedBlueprints(loadout, items)}
          level={crabLevel(selected.xp)}
          selectedMoves={[selected.main, "guard", selected.special]}
          offline={Boolean(userId && (cloudOffline || !navigator.onLine))}
          start={start}
        />
      </>
    );
  return (
    <>
      {networkError && (
        <p role="alert" className="notice error">
          {networkError}
        </p>
      )}
      <BattleArenaScreen
        key={session.battle.id}
        {...session}
        visible={visible}
        requestPending={requestPending}
        rewardText={
          session.remote
            ? battle?.status === "completed"
              ? "Crab XP saved to your account."
              : "Account practice · server-validated turns."
            : session.offline
              ? "Offline practice · no Crab XP awarded."
              : battle?.status === "completed"
                ? reward?.id === battle.id
                  ? reward.text
                  : "Saving Crab XP…"
                : "Exit grants no Crab XP."
        }
        rewardReady={
          !!session.remote ||
          !!session.offline ||
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
          session.remote
            ? void remoteAction("quit")
            : setSession((current) =>
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
    </>
  );
}
