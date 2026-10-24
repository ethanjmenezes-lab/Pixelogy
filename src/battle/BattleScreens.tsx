import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Crab } from "../components/Crab";
import { PlayerAvatar } from "../world/PlayerAvatar";
import type { Profile } from "../world/profile";
import { type Stats } from "../lib/gear";
import { catalog } from "../lib/gear";
import type { BattleAction, BattleState, FighterState } from "../lib/battle";
import { moves, moveValues, type MoveLoadout } from "../lib/moves";
import { cpuSetup } from "../lib/battle";
export function BattleIntroScreen({
  stats,
  gear,
  level,
  selectedMoves,
  start,
}: {
  stats: Stats;
  gear: string[];
  level: number;
  selectedMoves: MoveLoadout;
  start: () => void;
}) {
  return (
    <div className="battle-intro">
      <div className="page-title">
        <span className="eyebrow">A FRIENDLY CLASH ON THE COAST</span>
        <h1>Practice vs CPU.</h1>
        <p>Small claws. A little strategy. Your next great adventure.</p>
      </div>
      <section className="battle-arena panel">
        <div className="arena-heading">
          <span className="eyebrow">THE TIDAL TRAINING GROUNDS</span>
          <span className="pill">LOCAL PRACTICE</span>
        </div>
        <div className="fighters">
          {[
            { name: "Your crab", stats, gear },
            {
              name: "Pebble · CPU",
              stats: cpuSetup(level).stats,
              gear: ["can_shield"],
            },
          ].map((f) => (
            <div className="fighter" key={f.name}>
              <div className="fighter-info">
                <strong>{f.name}</strong>
                <span>{f.stats.hp} HP</span>
              </div>
              <div className="fighter-sprite">
                <Crab gear={f.gear} label={f.name} />
              </div>
              <p className="preview-stats">
                ATK {f.stats.atk} · DEF {f.stats.def} · SPD {f.stats.spd}
              </p>
            </div>
          ))}
        </div>
        <p>
          Pebble guards the shore. Bring your discovered gear and practice a
          little strategy.
        </p>
        <p className="preview-loadout">
          <strong>Your loadout: </strong>
          {gear.length
            ? gear.map((id) => catalog[id]?.label ?? id).join(" · ")
            : "Red crab · no equipped gear"}
        </p>
      </section>
      <section className="panel">
        <p>
          Crab level {level} · Pebble level {cpuSetup(level).level}
        </p>
        <p>
          Your moves: {selectedMoves.map((id) => moves[id].name).join(" · ")}
        </p>
        <p>Pebble trains stronger main attacks as your crab levels up.</p>
        <p>Win +40 battle XP · loss +15 · exit +0.</p>
        <p>
          Faster crab goes first; ties go to you. Battles award no cleanup XP.
        </p>
        <div className="button-row">
          <button className="button primary" onClick={start}>
            Start Battle
          </button>
          <Link className="button secondary" to="/workshop">
            Change Gear
          </Link>
        </div>
      </section>
    </div>
  );
}
export function BattleBackground() {
  return (
    <svg
      className="beach-backdrop"
      viewBox="0 0 240 240"
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      <path fill="#bfeee0" d="M0 0h240v240H0z" />
      <path
        fill="#fff8df"
        d="M180 18h24v24h-24zM12 35h35v6H12zM20 29h18v6H20zM110 52h40v6h-40z"
      />
      <path fill="#25c6b2" d="M0 78h240v162H0z" />
      <path
        fill="#176c79"
        opacity=".25"
        d="M0 88h50v3H0zm90 9h60v3H90zm90-14h60v3h-60z"
      />
      <path fill="#a9ddab" d="M0 115h38v7h40v7h55v-6h55v-8h52v125H0z" />
      <path fill="#fff8df" d="M0 122h38v7h40v7h55v-6h55v-8h52v118H0z" />
      <path fill="#f5cc83" d="M0 135h38v7h40v7h55v-6h55v-8h52v105H0z" />
      <path
        fill="#f58a08"
        opacity=".3"
        d="M14 174h8v3h-8zm171-17h6v3h-6zm-50 51h10v3h-10zm76 18h10v3h-10zM35 228h8v3h-8z"
      />
      <path
        fill="#fff8df"
        d="M12 98h18v2H12zm56-12h12v2H68zm94 20h24v2h-24zm40-12h19v2h-19z"
      />
    </svg>
  );
}
function HealthBar({ fighter }: { fighter: FighterState }) {
  return (
    <div className="battle-health">
      <strong>{fighter.nickname}</strong>
      <small>Crab Lv. {fighter.level}</small>
      <div
        className="hp-track"
        role="meter"
        aria-label={`${fighter.nickname} health`}
        aria-valuemin={0}
        aria-valuemax={fighter.startingStats.hp}
        aria-valuenow={fighter.currentHp}
      >
        <span
          style={{
            width: `${(100 * fighter.currentHp) / fighter.startingStats.hp}%`,
          }}
        />
      </div>
      <span>
        {fighter.currentHp} / {fighter.startingStats.hp} HP
      </span>
      {fighter.guarding && (
        <small>
          Defend · next hit halved
          {fighter.counterDamage ? " · counter ready" : ""}
        </small>
      )}
      {fighter.weakenedTurns > 0 && (
        <small>
          ATK −{fighter.attackReduction} · {fighter.weakenedTurns} turns
        </small>
      )}
    </div>
  );
}
function BattleMessageBox({ battle }: { battle: BattleState }) {
  const latest = battle.log.at(-1);
  return (
    <div className="battle-message">
      <div role="status">
        <p>
          {latest ? describe(latest) : "The tide is turning. Ready your claws!"}
        </p>
        <strong className="turn-banner">
          {battle.status !== "active"
            ? battle.status === "forfeited"
              ? "Practice abandoned"
              : battle.winnerId === "player"
                ? "Victory! Nicely pinched."
                : "Pebble wins. Ready for a rematch?"
            : battle.currentActorId === "player"
              ? "Your turn. Make a little wave."
              : "Pebble is choosing a move…"}
        </strong>
      </div>
      <details className="battle-history">
        <summary>Match notes · {battle.version} moves</summary>
        <div className="combat-log">
          {battle.log.length ? (
            battle.log.map((entry) => (
              <p key={entry.turn}>
                {entry.turn}. {describe(entry)}
              </p>
            ))
          ) : (
            <p>The faster crab goes first; ties go to you.</p>
          )}
        </div>
      </details>
    </div>
  );
}
function describe(entry: BattleState["log"][number]) {
  return `${entry.actorId === "player" ? "You" : "Pebble (CPU)"} used ${moves[entry.action].name}${entry.damage ? ` · ${entry.damage} damage${entry.hits > 1 ? ` (${entry.hits} hits)` : ""}` : ""}${entry.effect ? ` · ${entry.effect}` : ""}${entry.counterDamage ? ` · counter dealt ${entry.counterDamage} damage` : ""}.`;
}
function BattleActionMenu({
  battle,
  act,
  quit,
}: {
  battle: BattleState;
  act: (action: BattleAction) => void;
  quit: () => void;
}) {
  return (
    <div className="arena-actions">
      <div className="arena-moves">
        {battle.fighters[0].moves.map((action, index) => (
          <button
            key={action}
            className={`arena-move ${index === 1 ? "guard" : index === 2 ? "tidal_slam" : "pinch"}`}
            onClick={() => act(action)}
            disabled={
              battle.currentActorId !== "player" ||
              (battle.fighters[0].cooldowns[action] ?? 0) > 0
            }
          >
            <strong>{moves[action].name}</strong>
            <small>
              {(battle.fighters[0].cooldowns[action] ?? 0) > 0
                ? `${battle.fighters[0].cooldowns[action]} own turns remaining`
                : moveValues(moves[action])}
            </small>
          </button>
        ))}
      </div>
      <button className="arena-exit" onClick={quit}>
        Exit Practice
      </button>
    </div>
  );
}
export function BattleArenaScreen({
  battle,
  gear,
  trainer,
  act,
  quit,
  replay,
  intro,
  rewardText,
  rewardReady,
  rewardFailed,
  retryReward,
  currentLevel,
}: {
  battle: BattleState;
  gear: string[];
  trainer: Profile;
  act: (action: BattleAction) => void;
  quit: () => void;
  replay: () => void;
  intro: () => void;
  rewardText: string;
  rewardReady: boolean;
  rewardFailed: boolean;
  retryReward: () => void;
  currentLevel: number;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  const ended = battle.status !== "active";
  useEffect(() => {
    heading.current?.focus();
  }, [battle.id, ended]);
  const latest = battle.log.at(-1);
  return (
    <div className="battle-scene" data-battle-id={battle.id}>
      <h1 className="battle-scene-title" ref={heading} tabIndex={-1}>
        {ended
          ? battle.status === "forfeited"
            ? "Practice ended."
            : "Practice complete."
          : "Beach battle"}
      </h1>
      <div className="battle-stage">
        <BattleBackground />
        <div className="battle-hud">
          {battle.fighters.map((f) => (
            <HealthBar key={f.userId} fighter={f} />
          ))}
        </div>
        <div className="battle-trainer">
          <PlayerAvatar profile={trainer} facing="right" />
        </div>
        {battle.fighters.map((f, i) => (
          <div
            key={f.userId}
            className={`arena-crab ${i === 0 ? "ally" : "enemy"} ${f.currentHp === 0 ? "knocked-out" : ""}`}
            data-gear={i === 0 ? gear.join(",") : "can_shield"}
          >
            <div
              key={`${battle.id}-${battle.version}`}
              className={
                latest
                  ? latest.actorId === f.userId
                    ? moves[latest.action].animation
                    : latest.damage
                      ? "hit-reaction"
                      : ""
                  : ""
              }
            >
              <Crab gear={i === 0 ? gear : ["can_shield"]} label={f.nickname} />
            </div>
          </div>
        ))}
      </div>
      <BattleMessageBox battle={battle} />
      {ended ? (
        <div className="arena-results">
          <p role="status">
            {rewardText} Crab level {currentLevel}. No cleanup XP awarded.
          </p>
          {currentLevel > battle.fighters[0].level && (
            <p>
              Level up! Visit Workshop → Moves to choose newly unlocked attacks.
            </p>
          )}
          {rewardFailed && (
            <button className="button secondary" onClick={retryReward}>
              Retry XP save
            </button>
          )}
          <div className="button-row">
            <button
              className="button primary"
              disabled={!rewardReady}
              onClick={replay}
            >
              Play again
            </button>
            <button className="button secondary" onClick={intro}>
              Return to Matchup
            </button>
            <Link className="button secondary" to="/workshop">
              Change Gear
            </Link>
          </div>
        </div>
      ) : (
        <BattleActionMenu battle={battle} act={act} quit={quit} />
      )}
    </div>
  );
}
