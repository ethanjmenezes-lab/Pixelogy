import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Swords, Shield, Waves, RotateCcw, ArrowUpRight } from "lucide-react";
import { useGame } from "../components/GameContext";
import { Crab } from "../components/Crab";
import { statsFor } from "../lib/gear";
import { equippedBlueprints } from "../lib/storage";
import {
  createBattle,
  resolveTurn,
  cpuAction,
  type BattleAction,
} from "../lib/battle";
const moveNames = { pinch: "Pinch", guard: "Guard", tidal_slam: "Tidal Slam" };
export function Battle() {
  const { items, loadout } = useGame();
  const [battle, setBattle] = useState(() =>
    createBattle(statsFor(loadout, items), Object.values(loadout)),
  );
  const [gear, setGear] = useState(() => equippedBlueprints(loadout, items));
  const [notice, setNotice] = useState("");
  const [player, cpu] = battle.fighters;
  useEffect(() => {
    if (battle.currentActorId !== "cpu" || battle.status !== "active") return;
    const timer = setTimeout(
      () =>
        setBattle((current) =>
          current.status === "active" && current.currentActorId === "cpu"
            ? resolveTurn(current, "cpu", cpuAction(current))
            : current,
        ),
      850,
    );
    return () => clearTimeout(timer);
  }, [battle.currentActorId, battle.status, battle.version]);
  function act(action: BattleAction) {
    setBattle((current) => {
      if (current.currentActorId !== "player" || current.status !== "active")
        return current;
      try {
        return resolveTurn(current, "player", action);
      } catch {
        return current;
      }
    });
  }
  function restart() {
    setBattle(createBattle(statsFor(loadout, items), Object.values(loadout)));
    setGear(equippedBlueprints(loadout, items));
    setNotice("");
  }
  const ended = battle.status !== "active";
  return (
    <>
      <div className="section-heading page-title">
        <div>
          <span className="eyebrow">A FRIENDLY CLASH ON THE COAST</span>
          <h1>Practice vs CPU.</h1>
          <p>Small claws. A little strategy. Your next great adventure.</p>
        </div>
        <span className="pill">
          <span className="status-dot" /> LOCAL PRACTICE
        </span>
      </div>
      <section className="battle-arena panel">
        <div className="arena-heading">
          <span className="eyebrow">THE TIDAL TRAINING GROUNDS</span>
          <span className="turn-count">TURN {battle.version + 1}</span>
        </div>
        <div className="fighters">
          {[player, cpu].map((fighter, index) => (
            <div
              className={`fighter ${battle.currentActorId === fighter.userId ? "active" : ""}`}
              key={fighter.userId}
            >
              <div className="fighter-info">
                <strong>{fighter.nickname}</strong>
                <span>
                  {fighter.currentHp} / {fighter.startingStats.hp} HP
                </span>
              </div>
              <meter
                aria-label={`${fighter.nickname} health`}
                min={0}
                max={fighter.startingStats.hp}
                value={fighter.currentHp}
              />
              <div className="fighter-sprite">
                <Crab
                  gear={index === 0 ? gear : ["can_shield"]}
                  label={fighter.nickname}
                />
              </div>
              <span className="fighter-tag">
                {fighter.guarding
                  ? "SHIELDED · NEXT HIT HALVED"
                  : index === 0
                    ? "YOUR DISCOVERED GEAR"
                    : "CPU · AUTHORED TRAINING GEAR"}
              </span>
            </div>
          ))}
        </div>
        <span className="versus">VS</span>
        <div className="turn-banner" aria-live="polite">
          {ended
            ? battle.status === "forfeited"
              ? "Practice abandoned"
              : battle.winnerId === "player"
                ? "Victory! Nicely pinched."
                : "Pebble wins. Ready for a rematch?"
            : battle.currentActorId === "player"
              ? "Your turn. Make a little wave."
              : "Pebble is choosing a move…"}
        </div>
      </section>
      <div className="battle-bottom">
        <section className="panel battle-controls">
          <span className="eyebrow">
            {ended ? "ANOTHER ROUND?" : "CHOOSE YOUR MOVE"}
          </span>
          {ended ? (
            <>
              <h2>
                {battle.status === "forfeited"
                  ? "See you on the shore."
                  : "Practice complete."}
              </h2>
              <p>
                No cleanup XP is awarded for battles. Your gear stays yours.
              </p>
              <div className="button-row">
                <button className="button primary" onClick={restart}>
                  <RotateCcw size={17} /> Play again
                </button>
                <Link className="button secondary" to="/workshop">
                  Change gear <ArrowUpRight size={17} />
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="move-grid">
                {(
                  [
                    {
                      id: "pinch",
                      icon: Swords,
                      detail: "A trusty little hit · power 7",
                    },
                    {
                      id: "guard",
                      icon: Shield,
                      detail: "Halve the next incoming hit",
                    },
                    {
                      id: "tidal_slam",
                      icon: Waves,
                      detail: player.tidalCooldownRemaining
                        ? `${player.tidalCooldownRemaining} own turns remaining`
                        : "Make a splash · power 12",
                    },
                  ] as const
                ).map((move) => (
                  <button
                    key={move.id}
                    className={`move ${move.id}`}
                    onClick={() => act(move.id)}
                    disabled={
                      battle.currentActorId !== "player" ||
                      (move.id === "tidal_slam" &&
                        player.tidalCooldownRemaining > 0)
                    }
                  >
                    <move.icon size={26} />
                    <strong>{moveNames[move.id]}</strong>
                    <small>{move.detail}</small>
                  </button>
                ))}
              </div>
              <button
                className="button text"
                onClick={() => {
                  setBattle((s) => ({
                    ...s,
                    status: "forfeited",
                    currentActorId: null,
                  }));
                  setNotice("Practice abandoned; no victory awarded.");
                }}
              >
                Quit practice
              </button>
            </>
          )}
          <span role="status">{notice}</span>
        </section>
        <section className="panel combat-log">
          <span className="eyebrow">FROM THE SIDELINES</span>
          <h3>Match notes</h3>
          <div role="log" aria-live="polite">
            {battle.log.length ? (
              battle.log
                .slice(-4)
                .reverse()
                .map((entry) => (
                  <p key={entry.turn}>
                    <span>{String(entry.turn).padStart(2, "0")}</span>
                    {entry.actorId === "player"
                      ? "You"
                      : "Pebble (CPU)"} used {moveNames[entry.action]}
                    {entry.damage
                      ? ` · ${entry.damage} damage`
                      : " · guard ready"}
                    .
                  </p>
                ))
            ) : (
              <p>
                Welcome to practice. The faster crab goes first; ties go to you.
              </p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
